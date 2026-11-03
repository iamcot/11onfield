package com.elevenof.backoffice.service.quiz;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

/**
 * The players' side of the quiz: rank climbing (stars, server clock, shuffled options), practice by topic (no stars,
 * answer shown at once), mock exams (N questions, total time, graded on submit) and the leaderboards.
 * Only questions of the `practice` pool with status `active` are ever handed out.
 */
@Service
@RequiredArgsConstructor
public class QuizGameService {

    private static final Random RANDOM = new Random();
    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final JdbcTemplate jdbc;
    private final QuizSettings settings;
    private final QuizBankService bank;

    Clock clock = Clock.system(ZONE);

    private long now() {
        return clock.millis();
    }

    private LocalDate today() {
        return LocalDate.now(clock.withZone(ZONE));
    }

    // ---------- profile ----------

    private Map<String, Object> profileRow(long userId) {
        jdbc.update("INSERT IGNORE INTO quiz_profiles (user_id) VALUES (?)", userId);
        return jdbc.queryForMap("SELECT * FROM quiz_profiles WHERE user_id = ? FOR UPDATE", userId);
    }

    private static int i(Object v) {
        return v == null ? 0 : ((Number) v).intValue();
    }

    private Map<String, Object> rankView(int rank, int stars, int guard) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("rank", rank);
        out.put("rankKey", QuizGameRules.RANKS.get(rank).key());
        out.put("rankLabel", QuizGameRules.RANKS.get(rank).label());
        out.put("stars", stars);
        out.put("starsPerRank", settings.get("stars_per_rank"));
        out.put("guard", guard == 1);
        out.put("lastRank", QuizGameRules.isLastRank(rank));
        return out;
    }

    /** Profile, today's count, open question (to resume) and the topics for practice. */
    @Transactional
    public Map<String, Object> me(long userId) {
        closeExpired(userId);
        Map<String, Object> p = profileRow(userId);
        Map<String, Object> out = new LinkedHashMap<>(rankView(i(p.get("rank_idx")), i(p.get("stars")), i(p.get("guard"))));
        out.put("bestRank", i(p.get("best_rank_idx")));
        out.put("bestRankLabel", QuizGameRules.RANKS.get(i(p.get("best_rank_idx"))).label());
        out.put("streak", i(p.get("streak")));
        out.put("bestStreak", i(p.get("best_streak")));
        out.put("answered", i(p.get("answered")));
        out.put("correct", i(p.get("correct")));
        int cap = settings.get("daily_rank_cap");
        int todayCount = rankToday(userId);
        out.put("todayCount", todayCount);
        out.put("dailyCap", cap);
        out.put("seconds", settings.get("seconds"));
        out.put("mockSize", settings.get("mock_size"));
        out.put("mockMinutes", settings.get("mock_minutes"));
        out.put("ranks", QuizGameRules.RANKS.stream().map(QuizGameRules.Rank::label).toList());
        out.put("topics", bank.topics(true).stream().map(t -> Map.of("key", t.key(), "label", t.label(), "group", t.group())).toList());
        Long open = p.get("active_attempt_id") == null ? null : ((Number) p.get("active_attempt_id")).longValue();
        out.put("open", open == null ? null : questionView(open));
        out.put("serverNow", now());
        return out;
    }

    private int rankToday(long userId) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM quiz_attempts WHERE user_id = ? AND mode = 'rank' AND issued_at >= ?",
                Integer.class, userId, Timestamp.valueOf(today().atStartOfDay()));
        return n == null ? 0 : n;
    }

    /** An open question past its time (and the grace) is graded as a timeout: leaving does not save a star. */
    private void closeExpired(long userId) {
        List<Map<String, Object>> open = jdbc.queryForList("SELECT id, expires_at FROM quiz_attempts WHERE user_id = ? AND outcome = 'open'", userId);
        for (Map<String, Object> a : open) {
            long expires = millis(a.get("expires_at"));
            if (QuizGameRules.isLate(now(), expires)) grade(userId, ((Number) a.get("id")).longValue(), -1, false, true);
        }
    }

    // ---------- start ----------

    /**
     * Hands out one question. Rank mode: difficulty from the rank's mix, counts against the daily cap.
     * Practice mode: `topic` required, `difficulty` optional. An unanswered question still on time is handed back.
     */
    @Transactional
    public Map<String, Object> start(long userId, String mode, String topic, Integer difficulty) {
        if (!"rank".equals(mode) && !"practice".equals(mode)) throw new IllegalArgumentException("Chế độ không hợp lệ");
        closeExpired(userId);
        Map<String, Object> p = profileRow(userId);
        if (p.get("active_attempt_id") != null) {
            long openId = ((Number) p.get("active_attempt_id")).longValue();
            Map<String, Object> open = jdbc.queryForMap("SELECT mode, outcome FROM quiz_attempts WHERE id = ?", openId);
            if ("open".equals(open.get("outcome"))) {
                if (open.get("mode").equals(mode)) return questionView(openId);
                // switching mode: the open question is given up (a rank question counts as wrong)
                grade(userId, openId, -1, false, true);
                p = profileRow(userId);
            }
        }
        if ("rank".equals(mode)) {
            int cap = settings.get("daily_rank_cap");
            if (cap > 0 && rankToday(userId) >= cap) throw new IllegalStateException("Hôm nay bạn đã làm đủ " + cap + " câu leo hạng. Mai quay lại nhé, hoặc luyện theo chủ đề.");
        } else {
            if (topic == null || bank.topic(topic).filter(QuizBankService.Topic::active).isEmpty()) throw new IllegalArgumentException("Chọn một chủ đề");
            if (difficulty != null && !QuizBankRules.DIFFICULTIES.contains(difficulty)) throw new IllegalArgumentException("Độ khó phải từ 1 đến 5");
        }
        Long qid;
        if ("rank".equals(mode)) {
            int[][] mix = settings.rankMix();
            int level = QuizGameRules.pickDifficulty(mix[Math.max(0, Math.min(i(p.get("rank_idx")), mix.length - 1))], RANDOM.nextDouble());
            qid = pickRankQuestion(userId, level);
        } else {
            qid = pickQuestion(userId, topic, difficulty != null ? difficulty : 0, difficulty == null, null, false);
        }
        if (qid == null) throw new IllegalStateException("Chưa có câu hỏi nào cho lựa chọn này.");
        long issued = now();
        long expires = issued + settings.get("seconds") * 1000L;
        String order = QuizGameRules.shuffleOrder(RANDOM);
        jdbc.update("INSERT INTO quiz_attempts (user_id, question_id, mode, option_order, issued_at, expires_at) VALUES (?,?,?,?,?,?)",
                userId, qid, mode, order, new Timestamp(issued), new Timestamp(expires));
        long id = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        jdbc.update("UPDATE quiz_profiles SET active_attempt_id = ? WHERE user_id = ?", id, userId);
        jdbc.update("UPDATE quiz_questions SET times_served = times_served + 1 WHERE id = ?", qid);
        return questionView(id);
    }

    /**
     * Rank mode: topics take turns (the one not seen for longest first) and at least one question in every
     * `diagram_every` has a pitch diagram; the level comes from the rank's mix.
     */
    private Long pickRankQuestion(long userId, int level) {
        List<String> active = jdbc.queryForList("SELECT topic_key FROM quiz_topics WHERE active = 1 ORDER BY sort_order, topic_key", String.class);
        int every = settings.get("diagram_every");
        int window = Math.max(active.size(), every);
        List<String> recentTopics = new ArrayList<>();
        List<Boolean> recentDiagram = new ArrayList<>();
        jdbc.query("SELECT q.topic, q.diagram IS NOT NULL AS has_diagram FROM quiz_attempts a JOIN quiz_questions q ON q.id = a.question_id "
                        + "WHERE a.user_id = ? AND a.mode = 'rank' ORDER BY a.id DESC LIMIT ?",
                rs -> {
                    recentTopics.add(rs.getString("topic"));
                    recentDiagram.add(rs.getBoolean("has_diagram"));
                }, userId, window);
        List<String> order = QuizGameRules.topicOrder(active, recentTopics.subList(0, Math.min(recentTopics.size(), Math.max(active.size() - 1, 0))), RANDOM);
        if (QuizGameRules.needsDiagram(recentDiagram, every)) {
            Long withDiagram = pickQuestion(userId, null, level, false, order, true);
            if (withDiagram != null) return withDiagram;
        }
        return pickQuestion(userId, null, level, false, order, false);
    }

    /**
     * Not seen in `no_repeat_days`, then any level nearby, then a repeat. `anyLevel` = practice without a chosen level;
     * `topicOrder` = preferred topics first (rank mode); `diagramOnly` = only questions with a pitch diagram.
     */
    private Long pickQuestion(long userId, String topic, int level, boolean anyLevel, List<String> topicOrder, boolean diagramOnly) {
        int days = settings.get("no_repeat_days");
        Timestamp since = Timestamp.valueOf(LocalDateTime.now(clock.withZone(ZONE)).minusDays(days));
        List<Integer> levels = new ArrayList<>();
        if (anyLevel) levels.add(0);
        else {
            levels.add(level);
            levels.addAll(QuizGameRules.fallbackLevels(level));
        }
        for (boolean fresh : List.of(true, false)) {
            for (int lv : levels) {
                StringBuilder sql = new StringBuilder("SELECT q.id FROM quiz_questions q JOIN quiz_topics t ON t.topic_key = q.topic AND t.active = 1 "
                        + "WHERE q.status = 'active' AND q.pool = 'practice'");
                List<Object> args = new ArrayList<>();
                if (topic != null) { sql.append(" AND q.topic = ?"); args.add(topic); }
                if (lv > 0) { sql.append(" AND q.difficulty = ?"); args.add(lv); }
                if (diagramOnly) sql.append(" AND q.diagram IS NOT NULL");
                if (fresh) {
                    sql.append(" AND NOT EXISTS (SELECT 1 FROM quiz_attempts a WHERE a.user_id = ? AND a.question_id = q.id AND a.issued_at >= ?)");
                    args.add(userId);
                    args.add(since);
                }
                if (topicOrder != null && !topicOrder.isEmpty()) {
                    // preferred topic first; FIELD() is 0 for a topic outside the list, which then goes last
                    sql.append(" ORDER BY FIELD(q.topic, ").append(String.join(",", java.util.Collections.nCopies(topicOrder.size(), "?")))
                            .append(") = 0, FIELD(q.topic, ").append(String.join(",", java.util.Collections.nCopies(topicOrder.size(), "?"))).append("), RAND() LIMIT 1");
                    args.addAll(topicOrder);
                    args.addAll(topicOrder);
                } else {
                    sql.append(" ORDER BY RAND() LIMIT 1");
                }
                List<Long> ids = jdbc.queryForList(sql.toString(), Long.class, args.toArray());
                if (!ids.isEmpty()) return ids.get(0);
            }
            if (topic == null && !fresh) break;
        }
        return null;
    }

    /** What the player sees: options in the shown order, no right answer. */
    private Map<String, Object> questionView(long attemptId) {
        Map<String, Object> a = jdbc.queryForMap("SELECT * FROM quiz_attempts WHERE id = ?", attemptId);
        Map<String, Object> q = jdbc.queryForMap("SELECT q.*, t.label AS topic_label FROM quiz_questions q LEFT JOIN quiz_topics t ON t.topic_key = q.topic WHERE q.id = ?",
                ((Number) a.get("question_id")).longValue());
        String order = (String) a.get("option_order");
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("attemptId", attemptId);
        out.put("questionId", q.get("id"));
        out.put("mode", a.get("mode"));
        out.put("topic", q.get("topic"));
        out.put("topicLabel", q.get("topic_label"));
        out.put("difficulty", q.get("difficulty"));
        out.put("body", q.get("body"));
        out.put("options", QuizGameRules.inShownOrder(List.of((String) q.get("opt_a"), (String) q.get("opt_b"), (String) q.get("opt_c"), (String) q.get("opt_d")), order));
        out.put("mediaType", q.get("media_type"));
        out.put("diagram", parse((String) q.get("diagram")));
        out.put("mediaUrl", q.get("media_url"));
        out.put("issuedAt", millis(a.get("issued_at")));
        out.put("expiresAt", millis(a.get("expires_at")));
        out.put("serverNow", now());
        return out;
    }

    // ---------- answer ----------

    /** `option` = shown position 0..3; `away` = the page was hidden while answering. */
    @Transactional
    public Map<String, Object> answer(long userId, long attemptId, int option, boolean away) {
        return grade(userId, attemptId, option, away, false);
    }

    private Map<String, Object> grade(long userId, long attemptId, int option, boolean away, boolean forceTimeout) {
        Map<String, Object> p = profileRow(userId);
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM quiz_attempts WHERE id = ? AND user_id = ? FOR UPDATE", attemptId, userId);
        if (rows.isEmpty()) throw new IllegalArgumentException("Không tìm thấy câu hỏi");
        Map<String, Object> a = rows.get(0);
        if (!"open".equals(a.get("outcome"))) throw new IllegalStateException("Câu này đã trả lời rồi");
        long qid = ((Number) a.get("question_id")).longValue();
        Map<String, Object> q = jdbc.queryForMap("SELECT correct, explanation FROM quiz_questions WHERE id = ?", qid);
        String order = (String) a.get("option_order");
        int correctShown = QuizGameRules.shownOf(order, i(q.get("correct")));
        long answered = now();
        long issued = millis(a.get("issued_at"));
        long expires = millis(a.get("expires_at"));
        boolean timeout = forceTimeout || QuizGameRules.isLate(answered, expires) || option < 0 || option > 3;
        boolean correct = !timeout && option == correctShown;
        boolean flagged = QuizGameRules.flagged(correct, answered - issued, away);
        String outcome = timeout ? "timeout" : correct ? "correct" : "wrong";
        boolean rank = "rank".equals(a.get("mode"));

        Map<String, Object> out = new LinkedHashMap<>();
        QuizGameRules.State before = new QuizGameRules.State(i(p.get("rank_idx")), i(p.get("stars")), i(p.get("guard")));
        int delta = 0;
        if (rank) {
            QuizGameRules.Result r = QuizGameRules.apply(before, correct, settings.get("stars_per_rank"));
            QuizGameRules.State s = r.after();
            delta = r.starsDelta();
            int streak = correct ? i(p.get("streak")) + 1 : 0;
            jdbc.update("UPDATE quiz_profiles SET rank_idx = ?, stars = ?, guard = ?, best_rank_idx = GREATEST(best_rank_idx, ?), streak = ?, "
                            + "best_streak = GREATEST(best_streak, ?), answered = answered + 1, correct = correct + ?, active_attempt_id = NULL WHERE user_id = ?",
                    s.rank(), s.stars(), s.guard(), s.rank(), streak, streak, correct ? 1 : 0, userId);
            if (!flagged) {
                LocalDate day = today();
                for (String period : List.of(QuizGameRules.weekKey(day), QuizGameRules.monthKey(day))) {
                    jdbc.update("INSERT INTO quiz_board (user_id, period_key, stars, answered, correct) VALUES (?,?,?,1,?) "
                                    + "ON DUPLICATE KEY UPDATE stars = stars + VALUES(stars), answered = answered + 1, correct = correct + VALUES(correct)",
                            userId, period, delta, correct ? 1 : 0);
                }
            }
            out.put("before", rankView(before.rank(), before.stars(), before.guard()));
            out.put("after", rankView(s.rank(), s.stars(), s.guard()));
            out.put("rankedUp", r.rankedUp());
            out.put("rankedDown", r.rankedDown());
            out.put("guardLost", r.guardLost());
            out.put("streak", streak);
        } else {
            jdbc.update("UPDATE quiz_profiles SET active_attempt_id = NULL WHERE user_id = ? AND active_attempt_id = ?", userId, attemptId);
        }
        jdbc.update("UPDATE quiz_attempts SET answered_at = ?, chosen = ?, outcome = ?, flagged = ?, stars_delta = ? WHERE id = ?",
                new Timestamp(answered), timeout ? null : option, outcome, flagged ? 1 : 0, delta, attemptId);
        if (correct) jdbc.update("UPDATE quiz_questions SET times_correct = times_correct + 1 WHERE id = ?", qid);
        out.put("attemptId", attemptId);
        out.put("questionId", qid);
        out.put("mode", a.get("mode"));
        out.put("outcome", outcome);
        out.put("correct", correct);
        out.put("chosen", timeout ? null : option);
        out.put("correctOption", correctShown);
        out.put("explanation", q.get("explanation"));
        out.put("flagged", flagged);
        return out;
    }

    /** A player reports a mistake in a question; the third report hides it until an editor looks. False = reported before. */
    public boolean report(long userId, long questionId, String reason, String note) {
        Integer exists = jdbc.queryForObject("SELECT COUNT(*) FROM quiz_questions WHERE id = ?", Integer.class, questionId);
        if (exists == null || exists == 0) throw new IllegalArgumentException("Câu hỏi không tồn tại");
        int added = jdbc.update("INSERT IGNORE INTO quiz_question_reports (question_id, user_id, reason, note) VALUES (?,?,?,?)",
                questionId, userId, reason == null || reason.isBlank() ? "other" : reason.trim().substring(0, Math.min(reason.trim().length(), 30)),
                note == null ? null : note.substring(0, Math.min(note.length(), 200)));
        if (added == 0) return false;
        jdbc.update("UPDATE quiz_questions SET report_count = report_count + 1 WHERE id = ?", questionId);
        jdbc.update("UPDATE quiz_questions SET status = 'hidden', review_note = ? WHERE id = ? AND status = 'active' AND report_count >= 3", QuizBankService.REPORT_HIDE_NOTE, questionId);
        return true;
    }

    // ---------- mock exam ----------

    /** N questions spread over the active topics at difficulty 2..4 (any level when short), shown all at once. */
    @Transactional
    public Map<String, Object> mockStart(long userId) {
        int size = settings.get("mock_size");
        List<String> topics = bank.topics(true).stream().map(QuizBankService.Topic::key).toList();
        List<Long> picked = new ArrayList<>();
        for (String topic : QuizGameRules.spreadTopics(topics, size)) {
            List<Long> ids = jdbc.queryForList("SELECT id FROM quiz_questions WHERE status = 'active' AND pool = 'practice' AND topic = ? "
                    + "ORDER BY (difficulty BETWEEN 2 AND 4) DESC, RAND() LIMIT 30", Long.class, topic);
            for (Long id : ids) if (!picked.contains(id)) { picked.add(id); break; }
        }
        if (picked.size() < size) {
            for (Long id : jdbc.queryForList("SELECT id FROM quiz_questions WHERE status = 'active' AND pool = 'practice' ORDER BY RAND() LIMIT ?", Long.class, size * 2)) {
                if (picked.size() >= size) break;
                if (!picked.contains(id)) picked.add(id);
            }
        }
        if (picked.size() < Math.min(5, size)) throw new IllegalStateException("Kho câu hỏi chưa đủ để làm đề thử.");
        Collections.shuffle(picked, RANDOM);
        List<String> orders = new ArrayList<>();
        for (int k = 0; k < picked.size(); k++) orders.add(QuizGameRules.shuffleOrder(RANDOM));
        long start = now();
        long deadline = start + settings.get("mock_minutes") * 60_000L;
        jdbc.update("INSERT INTO quiz_mocks (user_id, question_ids, option_order, started_at, deadline, total) VALUES (?,?,?,?,?,?)",
                userId, join(picked), String.join(",", orders), new Timestamp(start), new Timestamp(deadline), picked.size());
        long id = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return mockView(id, userId);
    }

    private Map<String, Object> mockView(long mockId, long userId) {
        Map<String, Object> m = jdbc.queryForMap("SELECT * FROM quiz_mocks WHERE id = ? AND user_id = ?", mockId, userId);
        List<Long> ids = QuizGameRules.parseInts((String) m.get("question_ids")).stream().map(Integer::longValue).toList();
        String[] orders = ((String) m.get("option_order")).split(",");
        Map<Long, Map<String, Object>> qs = questionsById(ids);
        List<Map<String, Object>> items = new ArrayList<>();
        for (int k = 0; k < ids.size(); k++) {
            Map<String, Object> q = qs.get(ids.get(k));
            if (q == null) continue;
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("index", k);
            item.put("questionId", q.get("id"));
            item.put("topicLabel", q.get("topic_label"));
            item.put("group", q.get("topic_group"));
            item.put("body", q.get("body"));
            item.put("options", QuizGameRules.inShownOrder(List.of((String) q.get("opt_a"), (String) q.get("opt_b"), (String) q.get("opt_c"), (String) q.get("opt_d")), orders[k]));
            item.put("mediaType", q.get("media_type"));
            item.put("diagram", parse((String) q.get("diagram")));
            item.put("mediaUrl", q.get("media_url"));
            items.add(item);
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("mockId", mockId);
        out.put("startedAt", millis(m.get("started_at")));
        out.put("deadline", millis(m.get("deadline")));
        out.put("serverNow", now());
        out.put("finished", m.get("finished_at") != null);
        out.put("items", items);
        return out;
    }

    /** `answers` = shown position per question (-1 blank). Graded once; a late hand-in is graded and marked late. */
    @Transactional
    public Map<String, Object> mockSubmit(long userId, long mockId, List<Integer> answers) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM quiz_mocks WHERE id = ? AND user_id = ? FOR UPDATE", mockId, userId);
        if (rows.isEmpty()) throw new IllegalArgumentException("Không tìm thấy đề thử");
        Map<String, Object> m = rows.get(0);
        if (m.get("finished_at") != null) throw new IllegalStateException("Đề này đã nộp rồi");
        List<Long> ids = QuizGameRules.parseInts((String) m.get("question_ids")).stream().map(Integer::longValue).toList();
        String[] orders = ((String) m.get("option_order")).split(",");
        Map<Long, Map<String, Object>> qs = questionsById(ids);
        int right = 0;
        Map<String, int[]> byGroup = new LinkedHashMap<>();
        List<Map<String, Object>> review = new ArrayList<>();
        List<Integer> stored = new ArrayList<>();
        for (int k = 0; k < ids.size(); k++) {
            Map<String, Object> q = qs.get(ids.get(k));
            int chosen = answers != null && k < answers.size() && answers.get(k) != null ? answers.get(k) : -1;
            if (chosen < -1 || chosen > 3) chosen = -1;
            stored.add(chosen);
            if (q == null) continue;
            int correctShown = QuizGameRules.shownOf(orders[k], i(q.get("correct")));
            boolean ok = chosen == correctShown;
            if (ok) right++;
            String group = String.valueOf(q.get("topic_group"));
            int[] g = byGroup.computeIfAbsent(group, x -> new int[2]);
            g[1]++;
            if (ok) g[0]++;
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("index", k);
            r.put("chosen", chosen);
            r.put("correctOption", correctShown);
            r.put("correct", ok);
            r.put("explanation", q.get("explanation"));
            review.add(r);
        }
        boolean late = now() > millis(m.get("deadline")) + 30_000;
        jdbc.update("UPDATE quiz_mocks SET finished_at = ?, answers = ?, score = ?, late = ? WHERE id = ?",
                new Timestamp(now()), stored.stream().map(String::valueOf).reduce((x, y) -> x + "," + y).orElse(""), right, late ? 1 : 0, mockId);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("mockId", mockId);
        out.put("score", right);
        out.put("total", ids.size());
        out.put("percent", QuizGameRules.percent(right, ids.size()));
        out.put("late", late);
        List<Map<String, Object>> groups = new ArrayList<>();
        byGroup.forEach((g, v) -> groups.add(Map.of("group", g, "right", v[0], "total", v[1], "percent", QuizGameRules.percent(v[0], v[1]))));
        out.put("groups", groups);
        out.put("review", review);
        return out;
    }

    /** The player's last 10 mock exams. */
    public List<Map<String, Object>> mockHistory(long userId) {
        return jdbc.queryForList("SELECT id AS mockId, started_at AS startedAt, finished_at AS finishedAt, score, total, late FROM quiz_mocks "
                + "WHERE user_id = ? AND finished_at IS NOT NULL ORDER BY id DESC LIMIT 10", userId);
    }

    private Map<Long, Map<String, Object>> questionsById(List<Long> ids) {
        Map<Long, Map<String, Object>> out = new HashMap<>();
        if (ids.isEmpty()) return out;
        String marks = String.join(",", Collections.nCopies(ids.size(), "?"));
        for (Map<String, Object> q : jdbc.queryForList("SELECT q.*, t.label AS topic_label, t.topic_group FROM quiz_questions q "
                + "LEFT JOIN quiz_topics t ON t.topic_key = q.topic WHERE q.id IN (" + marks + ")", ids.toArray())) {
            out.put(((Number) q.get("id")).longValue(), q);
        }
        return out;
    }

    // ---------- leaderboard ----------

    /**
     * `type` week | month | all; `competitionId` limits it to that competition's players (not withdrawn).
     * Top 50 plus the caller's own line. Names are the last two words of the full name.
     */
    public Map<String, Object> leaderboard(String type, Long competitionId, Long callerId) {
        String t = Set.of("week", "month", "all").contains(type) ? type : "week";
        LocalDate day = today();
        String period = "week".equals(t) ? QuizGameRules.weekKey(day) : QuizGameRules.monthKey(day);
        String scope = competitionId == null ? "" :
                " AND EXISTS (SELECT 1 FROM competition_participants cp WHERE cp.user_id = u.id AND cp.competition_id = " + competitionId.longValue()
                        + " AND cp.status <> 'WITHDRAWN')";
        String sql;
        Object[] args;
        if ("all".equals(t)) {
            sql = "SELECT u.id, u.userid, u.full_name, u.avatar, p.rank_idx, p.stars, p.correct, p.answered FROM quiz_profiles p JOIN users u ON u.id = p.user_id "
                    + "WHERE p.answered > 0" + scope + " ORDER BY p.rank_idx DESC, p.stars DESC, p.correct DESC, u.id";
            args = new Object[0];
        } else {
            sql = "SELECT u.id, u.userid, u.full_name, u.avatar, p.rank_idx, b.stars, b.correct, b.answered FROM quiz_board b JOIN users u ON u.id = b.user_id "
                    + "JOIN quiz_profiles p ON p.user_id = b.user_id WHERE b.period_key = ? AND b.answered > 0" + scope
                    + " ORDER BY b.stars DESC, b.correct DESC, u.id";
            args = new Object[]{period};
        }
        List<Map<String, Object>> all = jdbc.query(sql, (rs, n) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("userId", rs.getLong("id"));
            row.put("userid", rs.getString("userid"));
            row.put("name", QuizGameRules.displayName(rs.getString("full_name")));
            row.put("avatar", rs.getString("avatar"));
            row.put("rankLabel", QuizGameRules.RANKS.get(Math.min(rs.getInt("rank_idx"), QuizGameRules.RANKS.size() - 1)).label());
            row.put("rank", rs.getInt("rank_idx"));
            row.put("stars", rs.getInt("stars"));
            row.put("correct", rs.getInt("correct"));
            row.put("answered", rs.getInt("answered"));
            return row;
        }, args);
        List<Map<String, Object>> top = new ArrayList<>();
        Map<String, Object> mine = null;
        for (int k = 0; k < all.size(); k++) {
            Map<String, Object> row = all.get(k);
            row.put("place", k + 1);
            if (k < 50) top.add(row);
            if (callerId != null && callerId.equals(row.get("userId"))) mine = row;
        }
        for (Map<String, Object> row : all) row.remove("userId");
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("type", t);
        out.put("period", "all".equals(t) ? null : period);
        out.put("total", all.size());
        out.put("top", top);
        out.put("me", mine);
        return out;
    }

    // ---------- admin ----------

    /** Back office numbers of the last 7 days. */
    public Map<String, Object> stats() {
        Timestamp since = Timestamp.valueOf(LocalDateTime.now(clock.withZone(ZONE)).minusDays(7));
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("players", jdbc.queryForObject("SELECT COUNT(*) FROM quiz_profiles WHERE answered > 0", Long.class));
        out.put("players7d", jdbc.queryForObject("SELECT COUNT(DISTINCT user_id) FROM quiz_attempts WHERE issued_at >= ?", Long.class, since));
        out.put("answers7d", jdbc.queryForObject("SELECT COUNT(*) FROM quiz_attempts WHERE issued_at >= ? AND outcome <> 'open'", Long.class, since));
        Long ok = jdbc.queryForObject("SELECT COUNT(*) FROM quiz_attempts WHERE issued_at >= ? AND outcome = 'correct'", Long.class, since);
        Long done = (Long) out.get("answers7d");
        out.put("correctRate7d", done == null || done == 0 ? null : Math.round(1000.0 * ok / done) / 1000.0);
        out.put("mocks7d", jdbc.queryForObject("SELECT COUNT(*) FROM quiz_mocks WHERE started_at >= ? AND finished_at IS NOT NULL", Long.class, since));
        out.put("ranks", jdbc.queryForList("SELECT rank_idx AS rank, COUNT(*) AS players FROM quiz_profiles WHERE answered > 0 GROUP BY rank_idx ORDER BY rank_idx"));
        out.put("flagged", jdbc.queryForList("SELECT u.full_name AS name, u.userid, COUNT(*) AS flagged FROM quiz_attempts a JOIN users u ON u.id = a.user_id "
                + "WHERE a.flagged = 1 AND a.issued_at >= ? GROUP BY u.id, u.full_name, u.userid ORDER BY flagged DESC LIMIT 20", since));
        out.put("rankLabels", QuizGameRules.RANKS.stream().map(QuizGameRules.Rank::label).toList());
        return out;
    }

    private static JsonNode parse(String json) {
        if (json == null) return null;
        try {
            return QuizBankRules.json().readTree(json);
        } catch (Exception e) {
            return null;
        }
    }

    private static String join(List<Long> ids) {
        StringBuilder sb = new StringBuilder();
        for (Long id : ids) sb.append(sb.isEmpty() ? "" : ",").append(id);
        return sb.toString();
    }

    /** DATETIME values come back as LocalDateTime (Connector/J 8) or Timestamp; both are wall time of the connection zone. */
    static long millis(Object v) {
        if (v instanceof Timestamp t) return t.getTime();
        if (v instanceof LocalDateTime l) return Timestamp.valueOf(l).getTime();
        if (v instanceof java.util.Date d) return d.getTime();
        throw new IllegalStateException("Không đọc được thời gian " + v);
    }
}
