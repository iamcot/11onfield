package com.elevenof.backoffice.service;

import com.elevenof.backoffice.model.*;
import com.elevenof.backoffice.repository.*;
import com.elevenof.backoffice.scoring.ScoringEngine;
import com.elevenof.backoffice.scoring.ScoringEngine.Bound;
import com.elevenof.backoffice.scoring.ScoringEngine.Level;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Scores an assessment day from the official values: attempts → value per assessment → 1–5 level per step →
 * topic points → day total. Steps without a condition-based scale keep the old scoring and are left out here.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ScoringService {

    private final CompetitionAssessmentDayRepository dayRepository;
    private final CompetitionAssessmentStepRepository stepRepository;
    private final CompetitionAssessmentRepository assessmentRepository;
    private final CompetitionAssessmentStepRatingRepository ratingRepository;
    private final CompetitionScoreTopicRepository topicRepository;
    private final MeasurementOfficialRepository officialRepository;
    private final MeasurementRawRepository rawRepository;
    private final CompetitionParticipantRepository participantRepository;
    private final PlayerRepository playerRepository;

    /** The step's scale as engine levels, or null when no level has a condition (legacy scale). */
    public List<Level> scaleOf(CompetitionAssessmentStep step) {
        List<CompetitionAssessmentStepRating> ratings = ratingRepository.findByAssessmentStepIdOrderByLevelDesc(step.getId());
        if (ratings.stream().allMatch(r -> r.getConditions().isEmpty())) return null;
        return ratings.stream().map(ScoringService::level).toList();
    }

    static Level level(CompetitionAssessmentStepRating r) {
        Map<Long, Bound> conditions = new LinkedHashMap<>();
        for (CompetitionRatingCondition c : r.getConditions()) {
            conditions.put(c.getAssessmentId(), new Bound(c.getRangeMin(), c.getRangeMax()));
        }
        return new Level(r.getLevel(), conditions);
    }

    // ============= Results =============

    public record AssessmentValue(Long assessmentId, String title, String unit, List<BigDecimal> attempts, BigDecimal value,
                                  Integer level) {
    }

    /** status: SCORED, PENDING (attempts missing), DNS, NOT_APPLICABLE (other audience). */
    public record StepResult(Long stepId, String title, Long topicId, String status, Integer level, String color,
                             String action, List<AssessmentValue> assessments) {
    }

    public record TopicResult(Long topicId, String key, String name, BigDecimal maxPoints, BigDecimal points, int steps,
                              int scoredSteps) {
    }

    public record ParticipantDay(Long participantId, boolean goalkeeper, List<StepResult> steps, List<TopicResult> topics,
                                 BigDecimal total, boolean complete) {
    }

    /** Scores every participant with at least one official value on the day, or only those given. */
    public List<ParticipantDay> scoreDay(Long dayId, Collection<Long> onlyParticipants) {
        CompetitionAssessmentDay day = dayRepository.findById(dayId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy ngày thi"));
        List<CompetitionAssessmentStep> steps = stepRepository.findByAssessmentDayIdOrderByDisplayOrderAsc(day.getId()).stream()
                .filter(s -> !Boolean.FALSE.equals(s.getIsScored()))
                .toList();
        Map<Long, List<CompetitionAssessment>> assessmentsByStep = new LinkedHashMap<>();
        Map<Long, List<Level>> scales = new HashMap<>();
        Map<Long, CompetitionAssessmentStepRating> ratingByStepLevel = new HashMap<>();
        for (CompetitionAssessmentStep s : steps) {
            List<Level> scale = scaleOf(s);
            if (scale == null) continue;
            scales.put(s.getId(), scale);
            assessmentsByStep.put(s.getId(), assessmentRepository.findByAssessmentStepIdOrderByDisplayOrderAsc(s.getId()));
            for (CompetitionAssessmentStepRating r : ratingRepository.findByAssessmentStepIdOrderByLevelDesc(s.getId())) {
                ratingByStepLevel.put(s.getId() * 10 + r.getLevel(), r);
            }
        }
        List<Long> assessmentIds = assessmentsByStep.values().stream().flatMap(List::stream).map(CompetitionAssessment::getId).toList();
        if (assessmentIds.isEmpty()) return List.of();

        List<MeasurementOfficial> officials = onlyParticipants == null
                ? officialRepository.findByAssessmentIdIn(assessmentIds)
                : onlyParticipants.stream().flatMap(p -> officialRepository.findByAssessmentIdInAndParticipantId(assessmentIds, p).stream()).toList();
        Map<Long, MeasurementRaw> raws = rawRepository.findAllById(officials.stream().map(MeasurementOfficial::getRawId)
                .filter(Objects::nonNull).collect(Collectors.toSet())).stream()
                .collect(Collectors.toMap(MeasurementRaw::getId, Function.identity()));
        Map<String, MeasurementOfficial> byKey = officials.stream()
                .collect(Collectors.toMap(o -> key(o.getAssessmentId(), o.getParticipantId(), o.getAttemptNumber()), Function.identity()));

        Set<Long> participants = new TreeSet<>(onlyParticipants != null ? onlyParticipants
                : officials.stream().map(MeasurementOfficial::getParticipantId).toList());
        Set<Long> goalkeepers = goalkeepers(participants);
        List<CompetitionScoreTopic> topics = topicRepository.findByAssessmentDayIdOrderByDisplayOrderAsc(dayId);

        List<ParticipantDay> out = new ArrayList<>();
        for (Long pid : participants) {
            boolean gk = goalkeepers.contains(pid);
            List<StepResult> stepResults = new ArrayList<>();
            for (CompetitionAssessmentStep s : steps) {
                if (!scales.containsKey(s.getId())) continue;
                stepResults.add(scoreStep(s, assessmentsByStep.get(s.getId()), scales.get(s.getId()), ratingByStepLevel,
                        pid, gk, byKey, raws));
            }
            List<TopicResult> topicResults = new ArrayList<>();
            for (CompetitionScoreTopic t : topics) {
                List<Integer> levels = new ArrayList<>();
                for (StepResult r : stepResults) {
                    if (!t.getId().equals(r.topicId()) || "NOT_APPLICABLE".equals(r.status())) continue;
                    levels.add(r.level());
                }
                BigDecimal points = ScoringEngine.topicPoints(t.getMaxPoints(), levels);
                topicResults.add(new TopicResult(t.getId(), t.getTopicKey(), t.getName(), t.getMaxPoints(), points,
                        levels.size(), (int) levels.stream().filter(Objects::nonNull).count()));
            }
            ScoringEngine.DayTotal total = ScoringEngine.dayTotal(topicResults.stream().map(TopicResult::points).toList());
            out.add(new ParticipantDay(pid, gk, stepResults, topicResults, total.points(), total.complete()));
        }
        return out;
    }

    private StepResult scoreStep(CompetitionAssessmentStep s, List<CompetitionAssessment> assessments, List<Level> scale,
                                 Map<Long, CompetitionAssessmentStepRating> ratings, Long pid, boolean gk,
                                 Map<String, MeasurementOfficial> byKey, Map<Long, MeasurementRaw> raws) {
        StepAudience audience = s.getAudience() != null ? s.getAudience() : StepAudience.ALL;
        if ((audience == StepAudience.GOALKEEPER && !gk) || (audience == StepAudience.OUTFIELD && gk)) {
            return new StepResult(s.getId(), s.getTitle(), s.getTopicId(), "NOT_APPLICABLE", null, null, null, List.of());
        }
        boolean pending = false;
        boolean dns = false;
        Map<Long, BigDecimal> values = new HashMap<>();
        List<AssessmentValue> rows = new ArrayList<>();
        for (CompetitionAssessment a : assessments) {
            List<BigDecimal> attempts = new ArrayList<>();
            boolean allDns = true;
            for (int i = 1; i <= a.getAttemptsCount(); i++) {
                MeasurementOfficial o = byKey.get(key(a.getId(), pid, i));
                MeasurementRaw r = o != null && o.getRawId() != null ? raws.get(o.getRawId()) : null;
                if (o == null || r == null || o.getState() == OfficialState.REVIEW) {
                    pending = true;
                    attempts.add(null);
                    allDns = false;
                    continue;
                }
                if (r.getStatus() != MeasurementStatus.DNS) allDns = false;
                attempts.add(r.getStatus() == MeasurementStatus.OK ? r.getValue() : null);
            }
            if (allDns) dns = true;
            BigDecimal v = ScoringEngine.aggregate(attempts, a.getScoringMethod(),
                    a.getDirection() != null ? a.getDirection() : ValueDirection.HIGHER);
            if (v != null) values.put(a.getId(), v);
            rows.add(new AssessmentValue(a.getId(), a.getTitle(), a.getUnit(), attempts, v, null));
        }
        if (dns) return new StepResult(s.getId(), s.getTitle(), s.getTopicId(), "DNS", null, null, null, rows);
        if (pending) return new StepResult(s.getId(), s.getTitle(), s.getTopicId(), "PENDING", null, null, null, rows);
        // Every attempt failed (faults only): the step is scored at the bottom level.
        ScoringEngine.Rating rating = ScoringEngine.rate(values, scale);
        int level = rating != null ? rating.level() : ScoringEngine.MIN_LEVEL;
        List<AssessmentValue> withLevels = rows.stream().map(r -> new AssessmentValue(r.assessmentId(), r.title(), r.unit(),
                r.attempts(), r.value(), rating != null ? rating.perAssessment().get(r.assessmentId()) : null)).toList();
        CompetitionAssessmentStepRating def = ratings.get(s.getId() * 10 + level);
        return new StepResult(s.getId(), s.getTitle(), s.getTopicId(), "SCORED", level,
                def != null ? def.getColor() : null, def != null && def.getAction() != null ? def.getAction().name() : null, withLevels);
    }

    private static String key(Long assessmentId, Long participantId, Integer attempt) {
        return assessmentId + "_" + participantId + "_" + attempt;
    }

    /** Participants whose first listed position is goalkeeper. */
    private Set<Long> goalkeepers(Collection<Long> participantIds) {
        if (participantIds.isEmpty()) return Set.of();
        Map<Long, Long> userOf = new HashMap<>();
        for (CompetitionParticipant p : participantRepository.findAllById(participantIds)) userOf.put(p.getUser().getId(), p.getId());
        Set<Long> out = new HashSet<>();
        for (Player pl : playerRepository.findByUserIdIn(userOf.keySet())) {
            String positions = pl.getPositions();
            if (positions == null) continue;
            String first = positions.split(",")[0].trim();
            if ("goalkeeper".equalsIgnoreCase(first)) out.add(userOf.get(pl.getUser().getId()));
        }
        return out;
    }

    // ============= Preview =============

    /** Level a set of values would get on a step, without saving; null when a constrained assessment has no value. */
    public ScoringEngine.Rating preview(Long stepId, Map<Long, List<BigDecimal>> attemptsByAssessment) {
        CompetitionAssessmentStep s = stepRepository.findById(stepId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài thi"));
        List<Level> scale = scaleOf(s);
        if (scale == null) return null;
        Map<Long, BigDecimal> values = new HashMap<>();
        for (CompetitionAssessment a : assessmentRepository.findByAssessmentStepIdOrderByDisplayOrderAsc(stepId)) {
            List<BigDecimal> attempts = attemptsByAssessment.getOrDefault(a.getId(), List.of());
            BigDecimal v = ScoringEngine.aggregate(attempts, a.getScoringMethod(),
                    a.getDirection() != null ? a.getDirection() : ValueDirection.HIGHER);
            if (v != null) values.put(a.getId(), v);
        }
        return ScoringEngine.rate(values, scale);
    }
}
