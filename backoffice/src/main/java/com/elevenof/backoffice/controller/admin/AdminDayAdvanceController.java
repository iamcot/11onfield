package com.elevenof.backoffice.controller.admin;

import com.elevenof.backoffice.model.CompetitionParticipant;
import com.elevenof.backoffice.model.User;
import com.elevenof.backoffice.repository.CompetitionParticipantRepository;
import com.elevenof.backoffice.repository.UserRepository;
import com.elevenof.backoffice.service.ScoringService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

/**
 * Who goes on to the next day (plan 06 part 3). The day the ranking comes from keeps "Số người đi tiếp" (advance_count);
 * the next day's list is day_participants: TOP from that ranking, EXCEPTION added by a coach or admin with a reason.
 */
@RestController
@RequestMapping("/api/admin/assessment-days/{dayId}/advance")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'HLV')")
public class AdminDayAdvanceController {

    private final JdbcTemplate jdbc;
    private final ScoringService scoringService;
    private final CompetitionParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final com.elevenof.backoffice.service.ParticipantFlagService flagService;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<?> get(@PathVariable Long dayId) {
        Map<String, Object> day = day(dayId);
        if (day == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy ngày thi");
        return ResponseEntity.ok(view(day));
    }

    /** body: { advanceCount } (null clears it). */
    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> setCount(@PathVariable Long dayId, @RequestBody Map<String, Object> body) {
        Map<String, Object> day = day(dayId);
        if (day == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy ngày thi");
        Integer n = body.get("advanceCount") == null || String.valueOf(body.get("advanceCount")).isBlank() ? null
                : Integer.valueOf(String.valueOf(body.get("advanceCount")).trim());
        if (n != null && n < 1) return error(HttpStatus.BAD_REQUEST, "Số người đi tiếp phải lớn hơn 0");
        jdbc.update("UPDATE competition_assessment_days SET advance_count = ? WHERE id = ?", n, dayId);
        return ResponseEntity.ok(view(day(dayId)));
    }

    /** Puts the top advance_count of this day's ranking on the next day's list; earlier TOP rows are replaced, exceptions stay. */
    @PostMapping("/top")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> moveTop(@PathVariable Long dayId) {
        Map<String, Object> day = day(dayId);
        if (day == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy ngày thi");
        Long next = nextDay(day);
        if (next == null) return error(HttpStatus.BAD_REQUEST, "Không có ngày thi sau ngày này");
        Integer count = day.get("advance_count") == null ? null : ((Number) day.get("advance_count")).intValue();
        if (count == null) return error(HttpStatus.BAD_REQUEST, "Chưa nhập số người đi tiếp");
        List<ScoringService.ParticipantDay> ranked = ranking(dayId).stream().filter(p -> !flagService.isBlocked(p.participantId())).toList();
        if (ranked.isEmpty()) return error(HttpStatus.BAD_REQUEST, "Ngày này chưa có thí sinh nào đủ điểm để xếp hạng");
        Long userId = currentUserId();
        jdbc.update("DELETE FROM day_participants WHERE day_id = ? AND reason = 'TOP'", next);
        for (ScoringService.ParticipantDay p : ranked.subList(0, Math.min(count, ranked.size()))) {
            jdbc.update("INSERT IGNORE INTO day_participants (day_id, participant_id, reason, added_by) VALUES (?, ?, 'TOP', ?)",
                    next, p.participantId(), userId);
        }
        return ResponseEntity.ok(view(day));
    }

    /** body: { sbd, note }: a coach's or admin's pick outside the top, with the reason. */
    @PostMapping("/exception")
    @PreAuthorize("hasAnyRole('ADMIN', 'HLV')")
    @Transactional
    public ResponseEntity<?> addException(@PathVariable Long dayId, @RequestBody Map<String, Object> body) {
        Map<String, Object> day = day(dayId);
        if (day == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy ngày thi");
        Long next = nextDay(day);
        if (next == null) return error(HttpStatus.BAD_REQUEST, "Không có ngày thi sau ngày này");
        String note = body.get("note") == null ? "" : String.valueOf(body.get("note")).trim();
        if (note.isEmpty()) return error(HttpStatus.BAD_REQUEST, "Cần ghi lý do cho trường hợp ngoại lệ");
        List<CompetitionParticipant> all = participantRepository.findByCompetitionIdWithUserOrderByRegistrationDate(competitionId(day));
        int sbd;
        try {
            sbd = Integer.parseInt(String.valueOf(body.get("sbd")).trim());
        } catch (NumberFormatException e) {
            return error(HttpStatus.BAD_REQUEST, "SBD không hợp lệ");
        }
        if (sbd < 1 || sbd > all.size()) return error(HttpStatus.BAD_REQUEST, "Không tìm thấy thí sinh với SBD: " + sbd);
        Long pid = all.get(sbd - 1).getId();
        Long have = jdbc.queryForObject("SELECT COUNT(*) FROM day_participants WHERE day_id = ? AND participant_id = ?", Long.class, next, pid);
        if (have != null && have > 0) return error(HttpStatus.CONFLICT, "SBD " + sbd + " đã có trong danh sách ngày sau");
        jdbc.update("INSERT INTO day_participants (day_id, participant_id, reason, note, added_by) VALUES (?, ?, 'EXCEPTION', ?, ?)",
                next, pid, note.length() > 300 ? note.substring(0, 300) : note, currentUserId());
        return ResponseEntity.ok(view(day));
    }

    @DeleteMapping("/{participantId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HLV')")
    @Transactional
    public ResponseEntity<?> remove(@PathVariable Long dayId, @PathVariable Long participantId) {
        Map<String, Object> day = day(dayId);
        if (day == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy ngày thi");
        Long next = nextDay(day);
        if (next != null) jdbc.update("DELETE FROM day_participants WHERE day_id = ? AND participant_id = ?", next, participantId);
        return ResponseEntity.ok(view(day));
    }

    // ---------------------------------------------------------------------------------------------------------

    private Map<String, Object> view(Map<String, Object> day) {
        Long dayId = ((Number) day.get("id")).longValue();
        Long next = nextDay(day);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("dayId", dayId);
        out.put("dayNumber", day.get("day_number"));
        out.put("advanceCount", day.get("advance_count"));
        out.put("nextDayId", next);
        out.put("nextDayNumber", next == null ? null : jdbc.queryForObject("SELECT day_number FROM competition_assessment_days WHERE id = ?", Integer.class, next));

        List<ScoringService.ParticipantDay> ranked = ranking(dayId);
        Map<Long, Integer> rankOf = new HashMap<>();
        Map<Long, BigDecimal> totalOf = new HashMap<>();
        for (int i = 0; i < ranked.size(); i++) { rankOf.put(ranked.get(i).participantId(), i + 1); totalOf.put(ranked.get(i).participantId(), ranked.get(i).total()); }
        out.put("ranked", ranked.size());

        List<CompetitionParticipant> all = participantRepository.findByCompetitionIdWithUserOrderByRegistrationDate(competitionId(day));
        Map<Long, Integer> sbdOf = new HashMap<>();
        Map<Long, String> nameOf = new HashMap<>();
        for (int i = 0; i < all.size(); i++) { sbdOf.put(all.get(i).getId(), i + 1); nameOf.put(all.get(i).getId(), all.get(i).getUser().getFullName()); }

        List<Map<String, Object>> list = new ArrayList<>();
        if (next != null) {
            for (Map<String, Object> r : jdbc.queryForList(
                    "SELECT participant_id, reason, note, added_at FROM day_participants WHERE day_id = ?", next)) {
                Long pid = ((Number) r.get("participant_id")).longValue();
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("participantId", pid);
                m.put("sbd", sbdOf.get(pid));
                m.put("fullName", nameOf.get(pid));
                m.put("reason", r.get("reason"));
                m.put("note", r.get("note"));
                m.put("rank", rankOf.get(pid));
                m.put("total", totalOf.get(pid));
                list.add(m);
            }
        }
        list.sort(Comparator.comparing((Map<String, Object> m) -> (Integer) m.get("rank"), Comparator.nullsLast(Comparator.naturalOrder())));
        out.put("list", list);

        // Bảng chốt of this day: everyone who took part (checked in, on the day's list or with a measurement), what they
        // have and where they stand. Blocked = taken out by the doctor; INCOMPLETE = a test still has no level.
        Map<Long, String> onNext = new HashMap<>();
        list.forEach(m -> onNext.put((Long) m.get("participantId"), String.valueOf(m.get("reason"))));
        Map<Long, ScoringService.ParticipantDay> scored = new HashMap<>();
        for (ScoringService.ParticipantDay pd : scoringService.scoreDay(dayId, null)) scored.put(pd.participantId(), pd);
        List<Long> dayList = jdbc.queryForList("SELECT participant_id FROM day_participants WHERE day_id = ?", Long.class, dayId);
        Set<Long> people = new LinkedHashSet<>(dayList.isEmpty()
                ? jdbc.queryForList("SELECT participant_id FROM stage_checkins WHERE stage_id = ?", Long.class, day.get("stage_id"))
                : dayList);
        people.addAll(scored.keySet());
        List<Map<String, Object>> standings = new ArrayList<>();
        int complete = 0, incomplete = 0, blocked = 0, out_ = 0;
        for (Long pid : people) {
            ScoringService.ParticipantDay pd = scored.get(pid);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("participantId", pid);
            m.put("sbd", sbdOf.get(pid));
            m.put("fullName", nameOf.get(pid));
            m.put("total", pd != null ? pd.total() : null);
            m.put("rank", rankOf.get(pid));
            long missing = pd == null ? -1 : pd.steps().stream().filter(st -> st.level() == null && !"NOT_APPLICABLE".equals(st.status())).count();
            m.put("missing", missing);
            boolean isComplete = pd != null && pd.complete();
            String status;
            if (flagService.isBlocked(pid)) { status = "BLOCKED"; blocked++; }
            else {
                if (isComplete) complete++; else incomplete++;
                if (onNext.containsKey(pid)) status = onNext.get(pid);
                else if (!isComplete) status = "INCOMPLETE";
                else if (onNext.isEmpty()) status = "COMPLETE";
                else { status = "OUT"; out_++; }
            }
            m.put("status", status);
            standings.add(m);
        }
        standings.sort(Comparator.comparing((Map<String, Object> m) -> (Integer) m.get("rank"), Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(m -> (Integer) m.get("sbd"), Comparator.nullsLast(Comparator.naturalOrder())));
        out.put("standings", standings);
        out.put("summary", Map.of("total", people.size(), "complete", complete, "incomplete", incomplete, "blocked", blocked,
                "advancing", list.size(), "out", out_));
        return out;
    }

    /** Contestants with a complete day, best total first (ties: lower participant id, i.e. earlier registration). */
    private List<ScoringService.ParticipantDay> ranking(Long dayId) {
        return scoringService.scoreDay(dayId, null).stream()
                .filter(ScoringService.ParticipantDay::complete)
                .sorted(Comparator.comparing(ScoringService.ParticipantDay::total, Comparator.reverseOrder())
                        .thenComparing(ScoringService.ParticipantDay::participantId))
                .toList();
    }

    private Map<String, Object> day(Long dayId) {
        return jdbc.queryForList("SELECT id, stage_id, day_number, advance_count FROM competition_assessment_days WHERE id = ?", dayId)
                .stream().findFirst().orElse(null);
    }

    private Long nextDay(Map<String, Object> day) {
        return jdbc.queryForList("SELECT id FROM competition_assessment_days WHERE stage_id = ? AND day_number > ? ORDER BY day_number LIMIT 1",
                Long.class, day.get("stage_id"), day.get("day_number")).stream().findFirst().orElse(null);
    }

    private Long competitionId(Map<String, Object> day) {
        return jdbc.queryForObject("SELECT competition_id FROM competition_stages WHERE id = ?", Long.class, day.get("stage_id"));
    }

    private Long currentUserId() {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;
        return userRepository.findByUserid(auth.getName()).or(() -> userRepository.findByPhone(auth.getName()))
                .map(User::getId).orElse(null);
    }

    private static ResponseEntity<Map<String, String>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("message", message));
    }
}
