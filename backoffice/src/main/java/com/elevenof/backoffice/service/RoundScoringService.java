package com.elevenof.backoffice.service;

import com.elevenof.backoffice.model.*;
import com.elevenof.backoffice.repository.*;
import com.elevenof.backoffice.scoring.RoundFormula;
import com.elevenof.backoffice.scoring.ScoringEngine;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Round scores: day totals from {@link ScoringService} plus manual scores, combined by the stage's {@link RoundFormula},
 * saved as one snapshot per participant, and ranked across the regional stages. Ranking only orders; picking people is
 * always done by hand.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class RoundScoringService {

    private final ScoreFormulaRepository formulaRepository;
    private final ScoreSnapshotRepository snapshotRepository;
    private final CompetitionStageRepository stageRepository;
    private final CompetitionAssessmentDayRepository dayRepository;
    private final CompetitionParticipantRepository participantRepository;
    private final com.elevenof.backoffice.service.SbdService sbdService;
    private final ManualScoreRepository manualScoreRepository;
    private final ParticipantFlagRepository flagRepository;
    private final GreenCardRepository greenCardRepository;
    private final SelectionVoteRepository voteRepository;
    private final PlayerRepository playerRepository;
    private final CompetitionScoreTopicRepository topicRepository;
    private final ScoringService scoringService;
    private final com.elevenof.backoffice.repository.StageResultRepository stageResultRepository;
    private final ObjectMapper objectMapper;
    private final org.springframework.jdbc.core.JdbcTemplate jdbc;

    // ============= Formula =============

    public record FormulaView(Integer version, boolean locked, boolean stored, RoundFormula definition, BigDecimal maxTotal) {
    }

    @Transactional(readOnly = true)
    public FormulaView formula(Long stageId) {
        return formulaRepository.findFirstByStageIdOrderByVersionDesc(stageId)
                .map(f -> {
                    RoundFormula def = parse(f.getDefinition());
                    return new FormulaView(f.getVersion(), f.getLockedAt() != null, true, def, def.maxTotal());
                })
                .orElseGet(() -> {
                    RoundFormula def = defaultFormula(stageId);
                    return new FormulaView(0, false, false, def, def.maxTotal());
                });
    }

    /** Saves a new version; refused once the newest version is locked. */
    public FormulaView saveFormula(Long stageId, RoundFormula definition, Long userId) {
        if (!stageRepository.existsById(stageId)) throw new IllegalArgumentException("Không tìm thấy vòng thi");
        List<String> problems = definition.validate();
        if (!problems.isEmpty()) throw new IllegalArgumentException("Công thức chưa hợp lệ: " + String.join("; ", problems));
        Optional<ScoreFormula> latest = formulaRepository.findFirstByStageIdOrderByVersionDesc(stageId);
        if (latest.isPresent() && latest.get().getLockedAt() != null) throw new IllegalArgumentException("Công thức đã khoá, không sửa được");
        formulaRepository.save(ScoreFormula.builder()
                .stageId(stageId)
                .version(latest.map(f -> f.getVersion() + 1).orElse(1))
                .definition(write(definition))
                .createdBy(userId)
                .createdAt(LocalDateTime.now())
                .build());
        return formula(stageId);
    }

    /** Freezes the formula in force (the default one is stored first). */
    public FormulaView lockFormula(Long stageId, Long userId) {
        ScoreFormula f = formulaRepository.findFirstByStageIdOrderByVersionDesc(stageId).orElse(null);
        if (f == null) {
            saveFormula(stageId, defaultFormula(stageId), userId);
            f = formulaRepository.findFirstByStageIdOrderByVersionDesc(stageId).orElseThrow();
        }
        if (f.getLockedAt() == null) {
            f.setLockedAt(LocalDateTime.now());
            formulaRepository.save(f);
        }
        return formula(stageId);
    }

    /** A stage scored by score groups (combine), as opposed to the old per-step sum. */
    public boolean isCombine(Long stageId) {
        return dayRepository.findByStageIdOrderByDisplayOrderAsc(stageId).stream()
                .anyMatch(d -> !topicRepository.findByAssessmentDayIdOrderByDisplayOrderAsc(d.getId()).isEmpty());
    }

    // ============= Snapshots =============

    /** Recomputes and stores the round score of everyone with a result or a manual score in the stage. */
    public int recompute(Long stageId) {
        CompetitionStage stage = stageRepository.findById(stageId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy vòng thi"));
        FormulaView fv = formula(stageId);
        RoundFormula formula = fv.definition();

        Map<Integer, Map<Long, ScoringService.ParticipantDay>> days = new HashMap<>();
        for (CompetitionAssessmentDay day : dayRepository.findByStageIdOrderByDisplayOrderAsc(stage.getId())) {
            days.put(day.getDayNumber(), scoringService.scoreDay(day.getId(), null).stream()
                    .collect(Collectors.toMap(ScoringService.ParticipantDay::participantId, d -> d)));
        }
        Map<Long, Map<String, BigDecimal>> manual = new HashMap<>();
        for (ManualScore m : manualScoreRepository.findCurrentByStageId(stageId)) {
            manual.computeIfAbsent(m.getParticipantId(), k -> new HashMap<>()).put(m.getComponentKey(), m.getPoints());
        }
        Set<Long> participants = new TreeSet<>(manual.keySet());
        days.values().forEach(m -> participants.addAll(m.keySet()));

        LocalDateTime now = LocalDateTime.now();
        for (Long pid : participants) {
            Map<String, BigDecimal> own = manual.getOrDefault(pid, Map.of());
            Map<String, BigDecimal> points = new LinkedHashMap<>();
            List<Map<String, Object>> componentRows = new ArrayList<>();
            List<Map<String, Object>> dayRows = new ArrayList<>();
            for (RoundFormula.Component c : formula.components()) {
                BigDecimal raw;
                if (RoundFormula.DAY.equals(c.type())) {
                    DayResult dr = day(days.getOrDefault(c.dayNumber(), Map.of()).get(pid), own, formula);
                    dayRows.add(dr.row(c.dayNumber()));
                    raw = dr.complete() ? dr.total() : null;
                    // An incomplete day still shows its partial points in the breakdown.
                    if (!dr.complete()) componentRows.add(component(c, dr.total(), null, false));
                } else {
                    raw = own.get(c.key());
                }
                BigDecimal p = RoundFormula.componentPoints(c, raw);
                points.put(c.key(), p);
                if (raw != null || !RoundFormula.DAY.equals(c.type())) componentRows.add(component(c, raw, p, raw != null));
            }
            RoundFormula.Total total = formula.total(points);
            Map<String, Object> breakdown = new LinkedHashMap<>();
            breakdown.put("formulaVersion", fv.version());
            breakdown.put("components", componentRows);
            breakdown.put("days", dayRows);

            ScoreSnapshot s = snapshotRepository.findByStageIdAndParticipantId(stageId, pid)
                    .orElseGet(() -> ScoreSnapshot.builder().stageId(stageId).participantId(pid).build());
            s.setFormulaVersion(fv.version());
            s.setTotal(total.total());
            s.setComplete(total.complete());
            s.setClassification(total.classification());
            s.setBreakdown(write(breakdown));
            s.setComputedAt(now);
            snapshotRepository.save(s);
        }
        log.info("Stage {}: {} round scores recomputed with formula v{}", stageId, participants.size(), fv.version());
        syncStageResults(stage, participants);
        return participants.size();
    }

    /**
     * Copies the round score into stage_results, which the Kết quả vòng table and the public results read: score and
     * rank for a complete round (rank by total, best first), empty for one that stopped early or is still missing
     * points. Rows a person edited by hand (is_calculated = false) and notes / video stay as they are.
     */
    private void syncStageResults(CompetitionStage stage, Set<Long> participants) {
        List<ScoreSnapshot> done = snapshotRepository.findByStageIdIn(List.of(stage.getId())).stream()
                .filter(s -> participants.contains(s.getParticipantId()))
                .toList();
        List<ScoreSnapshot> ranked = done.stream().filter(s -> Boolean.TRUE.equals(s.getComplete()) && s.getTotal() != null)
                .sorted(Comparator.comparing(ScoreSnapshot::getTotal).reversed().thenComparing(ScoreSnapshot::getParticipantId))
                .toList();
        Map<Long, Integer> rank = new HashMap<>();
        for (int i = 0; i < ranked.size(); i++) rank.put(ranked.get(i).getParticipantId(), i + 1);
        for (ScoreSnapshot s : done) {
            com.elevenof.backoffice.model.StageResult r = stageResultRepository.findByStageIdAndParticipantId(stage.getId(), s.getParticipantId())
                    .orElse(null);
            if (r != null && Boolean.FALSE.equals(r.getIsCalculated())) continue;
            if (r == null) {
                CompetitionParticipant p = participantRepository.findById(s.getParticipantId()).orElse(null);
                if (p == null) continue;
                r = com.elevenof.backoffice.model.StageResult.builder().stage(stage).participant(p).isPublic(Boolean.TRUE.equals(stage.getIsPublicScoring())).isCalculated(true).build();
            }
            boolean complete = rank.containsKey(s.getParticipantId());
            r.setScore(complete ? s.getTotal() : null);
            r.setRankPosition(rank.get(s.getParticipantId()));
            stageResultRepository.save(r);
        }
    }

    private static Map<String, Object> component(RoundFormula.Component c, BigDecimal raw, BigDecimal points, boolean present) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("key", c.key());
        m.put("label", c.label());
        m.put("type", c.type());
        m.put("raw", raw);
        m.put("points", points);
        m.put("present", present);
        return m;
    }

    private record DayResult(BigDecimal total, boolean complete, List<Map<String, Object>> topics) {
        Map<String, Object> row(Integer dayNumber) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("dayNumber", dayNumber);
            m.put("total", total);
            m.put("complete", complete);
            m.put("topics", topics);
            return m;
        }
    }

    /** Day total with topics that have no scored step filled from the manual score the formula maps them to (7v7). */
    private static DayResult day(ScoringService.ParticipantDay d, Map<String, BigDecimal> manual, RoundFormula formula) {
        if (d == null) return new DayResult(BigDecimal.ZERO.setScale(2), false, List.of());
        List<BigDecimal> topicPoints = new ArrayList<>();
        List<Map<String, Object>> rows = new ArrayList<>();
        for (ScoringService.TopicResult t : d.topics()) {
            BigDecimal p = t.points();
            String source = "STEPS";
            String manualKey = formula.topicManual() != null ? formula.topicManual().get(t.key()) : null;
            if (t.steps() == 0 && manualKey != null) {
                BigDecimal m = manual.get(manualKey);
                p = m == null ? null : m.min(t.maxPoints()).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
                source = manualKey;
            }
            topicPoints.add(p);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("key", t.key());
            row.put("name", t.name());
            row.put("maxPoints", t.maxPoints());
            row.put("points", p);
            row.put("source", source);
            rows.add(row);
        }
        ScoringEngine.DayTotal total = ScoringEngine.dayTotal(topicPoints);
        return new DayResult(total.points(), total.complete(), rows);
    }

    // ============= Ranking =============

    /**
     * stageId -> the people on the list of that stage's last day that has one (day 2: top x of day 1 plus exceptions).
     * Stages without any day list are absent: everyone stays in.
     */
    private Map<Long, Set<Long>> lastDayLists(List<Long> stageIds) {
        Map<Long, Set<Long>> out = new HashMap<>();
        if (stageIds.isEmpty()) return out;
        String in = String.join(",", Collections.nCopies(stageIds.size(), "?"));
        jdbc.query("SELECT d.stage_id, dp.participant_id FROM day_participants dp"
                + " JOIN competition_assessment_days d ON d.id = dp.day_id"
                + " WHERE d.stage_id IN (" + in + ")"
                + " AND d.day_number = (SELECT MAX(d2.day_number) FROM competition_assessment_days d2"
                + " JOIN day_participants dp2 ON dp2.day_id = d2.id WHERE d2.stage_id = d.stage_id)",
            (org.springframework.jdbc.core.RowCallbackHandler) rs -> out.computeIfAbsent(rs.getLong(1), k -> new HashSet<>()).add(rs.getLong(2)),
            stageIds.toArray());
        return out;
    }

    /**
     * Snapshots of the given stages (all stages of the competition when none given), ranked by the formula of the
     * first stage. Goalkeepers and outfield players are ranked apart; pass goalkeeper to get one list.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> ranking(Long competitionId, Collection<Long> stageIds, Boolean goalkeeper, Region region,
                                             String roundKey) {
        List<Long> stages = stageIds != null && !stageIds.isEmpty() ? new ArrayList<>(stageIds)
                : stageRepository.findByCompetitionIdOrderByStageNumberAsc(competitionId).stream().map(CompetitionStage::getId).toList();
        if (stages.isEmpty()) return List.of();
        RoundFormula formula = withTopicTieBreak(formula(stages.get(0)).definition(), stages.get(0));

        Map<Long, ScoreSnapshot> latest = new HashMap<>();
        for (ScoreSnapshot s : snapshotRepository.findByStageIdIn(stages)) {
            latest.merge(s.getParticipantId(), s, (a, b) -> a.getComputedAt().isAfter(b.getComputedAt()) ? a : b);
        }
        List<CompetitionParticipant> all = sbdService.contestants(competitionId);
        Map<Long, Integer> sbd = new HashMap<>();
        Map<Long, CompetitionParticipant> byId = new HashMap<>();
        for (int i = 0; i < all.size(); i++) {
            sbd.put(all.get(i).getId(), all.get(i).getSbd());
            byId.put(all.get(i).getId(), all.get(i));
        }
        Map<Long, String> positions = new HashMap<>();
        Map<Long, Long> participantOfUser = all.stream().collect(Collectors.toMap(p -> p.getUser().getId(), CompetitionParticipant::getId, (a, b) -> a));
        for (Player pl : playerRepository.findByUserIdIn(participantOfUser.keySet())) {
            positions.put(participantOfUser.get(pl.getUser().getId()), pl.getPositions());
        }
        Map<Long, List<ParticipantFlag>> flags = flagRepository.findByParticipantIdInAndRevokedAtIsNull(latest.keySet()).stream()
                .collect(Collectors.groupingBy(ParticipantFlag::getParticipantId));
        Set<Long> greenCards = greenCardRepository.findByCompetitionIdOrderByIdAsc(competitionId).stream()
                .map(GreenCard::getParticipantId).filter(Objects::nonNull).collect(Collectors.toSet());
        Map<Long, Long> votes = roundKey == null ? Map.of() : voteRepository.findByCompetitionIdAndRoundKey(competitionId, roundKey).stream()
                .collect(Collectors.groupingBy(SelectionVote::getParticipantId, Collectors.counting()));

        Map<Long, Set<Long>> cut = lastDayLists(stages);

        List<RoundFormula.Entry> entries = new ArrayList<>();
        Map<Long, Map<String, Object>> rows = new HashMap<>();
        for (ScoreSnapshot s : latest.values()) {
            CompetitionParticipant p = byId.get(s.getParticipantId());
            if (p == null) continue;
            // Out at a day cut (not on the list of the stage's last listed day): no longer a candidate.
            Set<Long> onList = cut.get(s.getStageId());
            if (onList != null && !onList.contains(p.getId())) continue;
            String pos = positions.get(p.getId());
            boolean gk = pos != null && "goalkeeper".equalsIgnoreCase(pos.split(",")[0].trim());
            if (goalkeeper != null && gk != goalkeeper) continue;
            if (region != null && p.getSelectedRegion() != region) continue;
            Map<String, Object> breakdown = read(s.getBreakdown());
            Map<String, BigDecimal> topicPoints = topicPoints(breakdown);
            List<ParticipantFlag> pf = flags.getOrDefault(p.getId(), List.of());
            long discipline = pf.stream().filter(f -> f.getKind() == ParticipantFlag.Kind.DISCIPLINE).count();
            entries.add(new RoundFormula.Entry(p.getId(), s.getTotal(), Boolean.TRUE.equals(s.getComplete()), topicPoints, discipline));

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("participantId", p.getId());
            row.put("sbd", sbd.get(p.getId()));
            row.put("fullName", p.getUser().getFullName());
            row.put("region", p.getSelectedRegion());
            row.put("positions", pos);
            row.put("goalkeeper", gk);
            row.put("stageId", s.getStageId());
            row.put("total", s.getTotal());
            row.put("complete", s.getComplete());
            row.put("classification", s.getClassification());
            row.put("formulaVersion", s.getFormulaVersion());
            row.put("topics", topicPoints);
            row.put("components", breakdown.get("components"));
            row.put("medicalOut", pf.stream().anyMatch(f -> f.getKind() == ParticipantFlag.Kind.MEDICAL_OUT));
            row.put("lowPerformance", pf.stream().anyMatch(f -> f.getKind() == ParticipantFlag.Kind.LOW_PERFORMANCE));
            row.put("disciplineCount", discipline);
            row.put("greenCard", greenCards.contains(p.getId()));
            row.put("votes", votes.getOrDefault(p.getId(), 0L));
            row.put("computedAt", s.getComputedAt());
            rows.put(p.getId(), row);
        }
        entries.sort(formula.order());
        List<Map<String, Object>> out = new ArrayList<>();
        int rank = 0;
        RoundFormula.Entry prev = null;
        for (int i = 0; i < entries.size(); i++) {
            RoundFormula.Entry e = entries.get(i);
            boolean tiedWithPrev = prev != null && formula.tied(prev, e);
            if (!tiedWithPrev) rank = i + 1;
            Map<String, Object> row = rows.get(e.participantId());
            row.put("rank", rank);
            row.put("tied", tiedWithPrev || (i + 1 < entries.size() && formula.tied(e, entries.get(i + 1))));
            out.add(row);
            prev = e;
        }
        return out;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, BigDecimal> topicPoints(Map<String, Object> breakdown) {
        Map<String, BigDecimal> out = new LinkedHashMap<>();
        Object days = breakdown.get("days");
        if (!(days instanceof List<?> list)) return out;
        for (Object d : list) {
            Object topics = ((Map<String, Object>) d).get("topics");
            if (!(topics instanceof List<?> tl)) continue;
            for (Object t : tl) {
                Map<String, Object> tm = (Map<String, Object>) t;
                Object p = tm.get("points");
                out.putIfAbsent(String.valueOf(tm.get("key")), p == null ? null : new BigDecimal(p.toString()));
            }
        }
        return out;
    }

    // ============= JSON =============

    RoundFormula parse(String json) {
        try {
            return objectMapper.readValue(json, RoundFormula.class);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Công thức lưu sai định dạng", e);
        }
    }

    private Map<String, Object> read(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() { });
        } catch (JsonProcessingException e) {
            return Map.of();
        }
    }

    private String write(Object o) {
        try {
            return objectMapper.writeValueAsString(o);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }

    /**
     * Ties are broken by the score groups in the order the admin numbered them on the round setup ("Ưu tiên đồng
     * điểm"), then by fewer discipline flags. Without any numbered group, the formula's own tie-break applies.
     */
    private RoundFormula withTopicTieBreak(RoundFormula formula, Long stageId) {
        List<String> keys = dayRepository.findByStageIdOrderByDisplayOrderAsc(stageId).stream()
                .flatMap(d -> topicRepository.findByAssessmentDayIdOrderByDisplayOrderAsc(d.getId()).stream())
                .filter(t -> t.getTieBreakOrder() != null)
                .sorted(Comparator.comparing(CompetitionScoreTopic::getTieBreakOrder))
                .map(CompetitionScoreTopic::getTopicKey)
                .collect(Collectors.toCollection(ArrayList::new));
        if (keys.isEmpty()) return formula;
        keys.add(RoundFormula.DISCIPLINE);
        return new RoundFormula(formula.components(), formula.topicManual(), formula.classes(), keys);
    }

    /** The round's last day (see RoundFormula.lastDay). */
    private RoundFormula defaultFormula(Long stageId) {
        return RoundFormula.lastDay(dayRepository.findByStageIdOrderByDisplayOrderAsc(stageId).stream()
                .map(CompetitionAssessmentDay::getDayNumber).distinct().sorted().toList());
    }
}
