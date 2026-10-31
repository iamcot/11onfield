package com.elevenof.backoffice.service;

import com.elevenof.backoffice.model.*;
import com.elevenof.backoffice.exception.ScaleInvalidException;
import com.elevenof.backoffice.repository.*;
import com.elevenof.backoffice.scoring.ScoringEngine;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Service for managing competition assessment structure (days, steps, assessments, rating scales)
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CompetitionAssessmentStructureService {

    private final CompetitionStageRepository stageRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbc;
    private final CompetitionAssessmentDayRepository assessmentDayRepository;
    private final CompetitionAssessmentStepRepository assessmentStepRepository;
    private final CompetitionAssessmentRepository assessmentRepository;
    private final CompetitionAssessmentStepRatingRepository ratingRepository;
    private final CompetitionScoreTopicRepository topicRepository;

    @PersistenceContext
    private EntityManager entityManager;

    // ============= Assessment Day Operations =============

    /**
     * Create a new assessment day for a stage
     */
    public CompetitionAssessmentDay createAssessmentDay(Long stageId, Integer dayNumber, String title,
                                                        String description, LocalDate assessmentDate, Integer displayOrder) {
        log.info("Creating assessment day for stage {}: day {}", stageId, dayNumber);

        CompetitionStage stage = stageRepository.findById(stageId)
            .orElseThrow(() -> new IllegalArgumentException("Stage not found: " + stageId));

        // Check for duplicate day number
        if (assessmentDayRepository.existsByStageIdAndDayNumber(stageId, dayNumber)) {
            throw new IllegalArgumentException("Assessment day with number " + dayNumber + " already exists for this stage");
        }

        CompetitionAssessmentDay day = CompetitionAssessmentDay.builder()
            .stage(stage)
            .dayNumber(dayNumber)
            .title(title)
            .description(description)
            .assessmentDate(assessmentDate)
            .displayOrder(displayOrder != null ? displayOrder : dayNumber)
            .build();

        return assessmentDayRepository.save(day);
    }

    /**
     * Get all assessment days for a stage, ordered by display order
     */
    public List<CompetitionAssessmentDay> getAssessmentDays(Long stageId) {
        return assessmentDayRepository.findByStageIdOrderByDisplayOrderAsc(stageId);
    }

    /**
     * Delete an assessment day (cascade deletes steps, assessments, results)
     */
    public void deleteAssessmentDay(Long dayId) {
        log.info("Deleting assessment day {}", dayId);
        // Straight SQL: the foreign keys cascade to steps, contents, scales, conditions, groups and measurements. Going
        // through Hibernate's cascade deleted the scale conditions twice (once by the database when the content went).
        jdbc.update("UPDATE competition_score_topics SET source_day_id = NULL WHERE source_day_id = ?", dayId);
        purgeMeasurements("SELECT a.id FROM competition_assessments a JOIN competition_assessment_steps st ON st.id = a.assessment_step_id WHERE st.assessment_day_id = ?", dayId);
        jdbc.update("DELETE FROM competition_assessment_days WHERE id = ?", dayId);
    }

    /**
     * Measurements of the given contents, removed before the contents themselves: a correction points at the record it
     * replaces and the official value at its record, and neither link cascades.
     */
    private void purgeMeasurements(String assessmentIdsSql, Long id) {
        List<Long> ids = jdbc.queryForList(assessmentIdsSql, Long.class, id);
        for (Long a : ids) {
            jdbc.update("DELETE FROM measurement_official WHERE assessment_id = ?", a);
            jdbc.update("UPDATE measurement_raw SET supersedes_id = NULL WHERE assessment_id = ?", a);
            jdbc.update("DELETE FROM measurement_raw WHERE assessment_id = ?", a);
        }
    }

    // ============= Assessment Step Operations =============

    /**
     * Create a new assessment step for a day
     */
    public CompetitionAssessmentStep createAssessmentStep(Long assessmentDayId, Integer stepNumber, String title,
                                                          String description, Integer displayOrder, Boolean hasRatingScale) {
        log.info("Creating assessment step for day {}: step {}", assessmentDayId, stepNumber);

        CompetitionAssessmentDay day = assessmentDayRepository.findById(assessmentDayId)
            .orElseThrow(() -> new IllegalArgumentException("Assessment day not found: " + assessmentDayId));

        // Check for duplicate step number
        if (assessmentStepRepository.existsByAssessmentDayIdAndStepNumber(assessmentDayId, stepNumber)) {
            throw new IllegalArgumentException("Assessment step with number " + stepNumber + " already exists for this day");
        }

        CompetitionAssessmentStep step = CompetitionAssessmentStep.builder()
            .assessmentDay(day)
            .stepNumber(stepNumber)
            .title(title)
            .description(description)
            .displayOrder(displayOrder != null ? displayOrder : stepNumber)
            .hasRatingScale(hasRatingScale != null ? hasRatingScale : true)
            .build();

        return assessmentStepRepository.save(step);
    }

    /**
     * Get all assessment steps for a day, ordered by display order
     */
    public List<CompetitionAssessmentStep> getAssessmentSteps(Long assessmentDayId) {
        return assessmentStepRepository.findByAssessmentDayIdOrderByDisplayOrderAsc(assessmentDayId);
    }

    /**
     * Delete an assessment step (cascade deletes assessments, results)
     */
    public void deleteAssessmentStep(Long stepId) {
        log.info("Deleting assessment step {}", stepId);
        purgeMeasurements("SELECT id FROM competition_assessments WHERE assessment_step_id = ?", stepId);
        jdbc.update("DELETE FROM competition_assessment_steps WHERE id = ?", stepId);
    }

    // ============= Assessment Operations =============

    /**
     * Create a new assessment for a step
     */
    public CompetitionAssessment createAssessment(Long assessmentStepId, Integer assessmentNumber, String title,
                                                  String description, String unit, Integer attemptsCount,
                                                  ScoringMethod scoringMethod, Integer displayOrder) {
        log.info("Creating assessment for step {}: assessment {}", assessmentStepId, assessmentNumber);

        CompetitionAssessmentStep step = assessmentStepRepository.findById(assessmentStepId)
            .orElseThrow(() -> new IllegalArgumentException("Assessment step not found: " + assessmentStepId));

        // Check for duplicate assessment number
        if (assessmentRepository.existsByAssessmentStepIdAndAssessmentNumber(assessmentStepId, assessmentNumber)) {
            throw new IllegalArgumentException("Assessment with number " + assessmentNumber + " already exists for this step");
        }

        CompetitionAssessment assessment = CompetitionAssessment.builder()
            .assessmentStep(step)
            .assessmentNumber(assessmentNumber)
            .title(title)
            .description(description)
            .unit(unit)
            .attemptsCount(attemptsCount != null ? attemptsCount : 1)
            .scoringMethod(scoringMethod != null ? scoringMethod : ScoringMethod.BEST_OF)
            .displayOrder(displayOrder != null ? displayOrder : assessmentNumber)
            .build();

        return assessmentRepository.save(assessment);
    }

    /**
     * Get all assessments for a step, ordered by display order
     */
    public List<CompetitionAssessment> getAssessments(Long assessmentStepId) {
        return assessmentRepository.findByAssessmentStepIdOrderByDisplayOrderAsc(assessmentStepId);
    }

    /**
     * Delete an assessment (cascade deletes results)
     */
    public void deleteAssessment(Long assessmentId) {
        log.info("Deleting assessment {}", assessmentId);
        purgeMeasurements("SELECT ?", assessmentId);
        jdbc.update("DELETE FROM competition_assessments WHERE id = ?", assessmentId);
    }

    // ============= Edit Operations =============

    public CompetitionAssessmentDay updateAssessmentDay(Long dayId, String title, String description, LocalDate assessmentDate) {
        CompetitionAssessmentDay day = assessmentDayRepository.findById(dayId)
            .orElseThrow(() -> new IllegalArgumentException("Assessment day not found: " + dayId));
        day.setTitle(title);
        day.setDescription(description);
        day.setAssessmentDate(assessmentDate);
        return assessmentDayRepository.save(day);
    }

    public CompetitionAssessmentStep updateAssessmentStep(Long stepId, String title, String description, Boolean hasRatingScale) {
        CompetitionAssessmentStep step = assessmentStepRepository.findById(stepId)
            .orElseThrow(() -> new IllegalArgumentException("Assessment step not found: " + stepId));
        step.setTitle(title);
        step.setDescription(description);
        if (hasRatingScale != null) step.setHasRatingScale(hasRatingScale);
        return assessmentStepRepository.save(step);
    }

    public CompetitionAssessment updateAssessment(Long assessmentId, String title, String description, String unit,
                                                  Integer attemptsCount, ScoringMethod scoringMethod) {
        CompetitionAssessment a = assessmentRepository.findById(assessmentId)
            .orElseThrow(() -> new IllegalArgumentException("Assessment not found: " + assessmentId));
        a.setTitle(title);
        if (description != null) a.setDescription(description); // the admin form has no description field for assessments
        a.setUnit(unit);
        if (attemptsCount != null && attemptsCount > 0) a.setAttemptsCount(attemptsCount);
        if (scoringMethod != null) a.setScoringMethod(scoringMethod);
        return assessmentRepository.save(a);
    }

    // ============= Rating Scale Operations =============

    /**
     * Create or update rating scale for a step (all 5 levels at once)
     * @param levels List of exactly 5 rating scale definitions
     */
    public List<CompetitionAssessmentStepRating> createOrUpdateRatingScale(Long assessmentStepId,
                                                                           List<RatingScaleDefinition> levels) {
        log.info("Creating/updating rating scale for step {}", assessmentStepId);

        CompetitionAssessmentStep step = assessmentStepRepository.findById(assessmentStepId)
            .orElseThrow(() -> new IllegalArgumentException("Assessment step not found: " + assessmentStepId));

        // Validate that step has at least 1 assessment
        long assessmentCount = assessmentRepository.countByAssessmentStepId(assessmentStepId);
        if (assessmentCount == 0) {
            throw new IllegalArgumentException("Cannot create rating scale: step must have at least 1 assessment");
        }

        // Validate levels list
        if (levels == null || levels.size() != 5) {
            throw new IllegalArgumentException("Must provide exactly 5 rating scale levels");
        }

        // A level with conditions follows the combine rules: check the whole scale before touching the stored one.
        boolean conditional = levels.stream().anyMatch(d -> d.getConditions() != null && !d.getConditions().isEmpty());
        if (conditional) {
            List<CompetitionAssessment> stepAssessments = assessmentRepository.findByAssessmentStepIdOrderByDisplayOrderAsc(assessmentStepId);
            java.util.Map<Long, ScoringEngine.AssessmentSpec> specs = new java.util.LinkedHashMap<>();
            for (CompetitionAssessment a : stepAssessments) {
                specs.put(a.getId(), new ScoringEngine.AssessmentSpec(a.getTitle(), a.getDirection(), a.getPlausibleMin(), a.getPlausibleMax()));
            }
            List<ScoringEngine.Level> scale = new java.util.ArrayList<>();
            List<String> problems = new java.util.ArrayList<>();
            for (RatingScaleDefinition def : levels) {
                java.util.Map<Long, ScoringEngine.Bound> bounds = new java.util.LinkedHashMap<>();
                if (def.getConditions() != null) {
                    for (ConditionDefinition c : def.getConditions()) {
                        if (!specs.containsKey(c.getAssessmentId())) {
                            problems.add("Mức " + def.getLevel() + ": nội dung thi " + c.getAssessmentId() + " không thuộc bài này");
                            continue;
                        }
                        bounds.put(c.getAssessmentId(), new ScoringEngine.Bound(c.getMin(), c.getMax()));
                    }
                }
                scale.add(new ScoringEngine.Level(def.getLevel() != null ? def.getLevel() : 0, bounds));
            }
            problems.addAll(ScoringEngine.validate(scale, specs));
            if (!problems.isEmpty()) throw new ScaleInvalidException(problems);
        }

        // Delete existing ratings
        ratingRepository.deleteByAssessmentStepId(assessmentStepId);

        // Flush to ensure delete is committed before insert
        entityManager.flush();

        // Create new ratings
        List<CompetitionAssessmentStepRating> ratings = new java.util.ArrayList<>();
        for (RatingScaleDefinition def : levels) {
            CompetitionAssessmentStepRating rating = CompetitionAssessmentStepRating.builder()
                .assessmentStep(step)
                .level(def.getLevel())
                .thresholdType(def.getThresholdType())
                .thresholdValue(def.getThresholdValue())
                .rangeMin(def.getRangeMin())
                .rangeMax(def.getRangeMax())
                .description(def.getDescription())
                .color(def.getColor())
                .action(def.getAction() != null ? def.getAction() : RatingAction.NONE)
                .build();
            if (def.getConditions() != null) {
                for (ConditionDefinition c : def.getConditions()) {
                    rating.getConditions().add(CompetitionRatingCondition.builder()
                        .rating(rating).assessmentId(c.getAssessmentId()).rangeMin(c.getMin()).rangeMax(c.getMax()).build());
                }
            } else if (def.getThresholdType() == null) {
                throw new IllegalArgumentException("Mức " + def.getLevel() + " cần ngưỡng hoặc điều kiện");
            }
            ratings.add(ratingRepository.save(rating));
        }

        log.info("Created {} rating levels for step {}", ratings.size(), assessmentStepId);
        return ratings;
    }

    /**
     * Get rating scale for a step
     */
    public List<CompetitionAssessmentStepRating> getRatingScale(Long assessmentStepId) {
        List<CompetitionAssessmentStepRating> levels = ratingRepository.findByAssessmentStepIdOrderByLevelDesc(assessmentStepId);
        levels.forEach(r -> r.getConditions().size()); // serialized after the session closes
        return levels;
    }

    // ============= Full Structure Operations =============

    /**
     * Get complete assessment structure for a stage
     */
    public List<CompetitionAssessmentDay> getFullAssessmentStructure(Long stageId) {
        log.info("Getting full assessment structure for stage {}", stageId);

        // Fetch all days with eager loading of nested collections
        List<CompetitionAssessmentDay> days = assessmentDayRepository.findByStageIdOrderByDisplayOrderAsc(stageId);

        // Force load lazy collections
        for (CompetitionAssessmentDay day : days) {
            day.getAssessmentSteps().size();
            for (CompetitionAssessmentStep step : day.getAssessmentSteps()) {
                step.getAssessments().size();
                step.getRatingScales().forEach(r -> r.getConditions().size());
            }
        }

        return days;
    }

    // ============= Copy Structure Operations =============

    /**
     * Copy assessment structure from source stage to target stage
     * WARNING: This will delete any existing structure in the target stage
     */
    public void copyStructureFromStage(Long sourceStageId, Long targetStageId) {
        log.info("Copying assessment structure from stage {} to stage {}", sourceStageId, targetStageId);

        // 1. Delete existing structure in target stage
        List<CompetitionAssessmentDay> existingDays = assessmentDayRepository.findByStageIdOrderByDisplayOrderAsc(targetStageId);
        for (CompetitionAssessmentDay day : existingDays) {
            assessmentDayRepository.delete(day); // Cascades to steps, assessments, ratings
        }
        log.info("Deleted {} existing days from target stage", existingDays.size());

        // 2. Get source structure and target stage
        CompetitionStage targetStage = stageRepository.findById(targetStageId)
            .orElseThrow(() -> new IllegalArgumentException("Target stage not found: " + targetStageId));

        List<CompetitionAssessmentDay> sourceDays = assessmentDayRepository.findByStageIdOrderByDisplayOrderAsc(sourceStageId);

        if (sourceDays.isEmpty()) {
            log.warn("Source stage {} has no assessment structure to copy", sourceStageId);
            return;
        }

        // 3. Copy days and their hierarchies
        for (CompetitionAssessmentDay sourceDay : sourceDays) {
            // Copy day
            CompetitionAssessmentDay newDay = CompetitionAssessmentDay.builder()
                .stage(targetStage)
                .dayNumber(sourceDay.getDayNumber())
                .title(sourceDay.getTitle())
                .description(sourceDay.getDescription())
                .assessmentDate(sourceDay.getAssessmentDate())
                .displayOrder(sourceDay.getDisplayOrder())
                .build();
            newDay = assessmentDayRepository.save(newDay);
            log.debug("Copied day: {}", newDay.getTitle());

            java.util.Map<Long, Long> topicIds = new java.util.HashMap<>();
            for (CompetitionScoreTopic t : topicRepository.findByAssessmentDayIdOrderByDisplayOrderAsc(sourceDay.getId())) {
                CompetitionScoreTopic copy = topicRepository.save(CompetitionScoreTopic.builder()
                    .assessmentDayId(newDay.getId()).topicKey(t.getTopicKey()).name(t.getName()).maxPoints(t.getMaxPoints())
                    .displayOrder(t.getDisplayOrder()).tieBreakOrder(t.getTieBreakOrder()).source(t.getSource()).sourceDayId(t.getSourceDayId()).build());
                topicIds.put(t.getId(), copy.getId());
            }

            // Copy steps for this day
            List<CompetitionAssessmentStep> sourceSteps = assessmentStepRepository.findByAssessmentDayIdOrderByDisplayOrderAsc(sourceDay.getId());
            for (CompetitionAssessmentStep sourceStep : sourceSteps) {
                // Copy step
                CompetitionAssessmentStep newStep = CompetitionAssessmentStep.builder()
                    .assessmentDay(newDay)
                    .stepNumber(sourceStep.getStepNumber())
                    .title(sourceStep.getTitle())
                    .description(sourceStep.getDescription())
                    .displayOrder(sourceStep.getDisplayOrder())
                    .hasRatingScale(sourceStep.getHasRatingScale())
                    .isScored(sourceStep.getIsScored())
                    .audience(sourceStep.getAudience())
                    .scoreSource(sourceStep.getScoreSource())
                    .topicId(sourceStep.getTopicId() != null ? topicIds.get(sourceStep.getTopicId()) : null)
                    .build();
                newStep = assessmentStepRepository.save(newStep);
                log.debug("  Copied step: {}", newStep.getTitle());

                // Copy assessments for this step
                List<CompetitionAssessment> sourceAssessments = assessmentRepository.findByAssessmentStepIdOrderByDisplayOrderAsc(sourceStep.getId());
                java.util.Map<Long, Long> assessmentIds = new java.util.HashMap<>();
                for (CompetitionAssessment sourceAssessment : sourceAssessments) {
                    CompetitionAssessment newAssessment = CompetitionAssessment.builder()
                        .assessmentStep(newStep)
                        .assessmentNumber(sourceAssessment.getAssessmentNumber())
                        .title(sourceAssessment.getTitle())
                        .description(sourceAssessment.getDescription())
                        .unit(sourceAssessment.getUnit())
                        .attemptsCount(sourceAssessment.getAttemptsCount())
                        .scoringMethod(sourceAssessment.getScoringMethod())
                        .displayOrder(sourceAssessment.getDisplayOrder())
                        .direction(sourceAssessment.getDirection())
                        .plausibleMin(sourceAssessment.getPlausibleMin())
                        .plausibleMax(sourceAssessment.getPlausibleMax())
                        .tolerance(sourceAssessment.getTolerance())
                        .valueType(sourceAssessment.getValueType())
                        .build();
                    newAssessment = assessmentRepository.save(newAssessment);
                    assessmentIds.put(sourceAssessment.getId(), newAssessment.getId());
                    log.debug("    Copied assessment: {}", newAssessment.getTitle());
                }

                // Copy rating scales for this step
                List<CompetitionAssessmentStepRating> sourceRatings = ratingRepository.findByAssessmentStepIdOrderByLevelDesc(sourceStep.getId());
                for (CompetitionAssessmentStepRating sourceRating : sourceRatings) {
                    CompetitionAssessmentStepRating newRating = CompetitionAssessmentStepRating.builder()
                        .assessmentStep(newStep)
                        .level(sourceRating.getLevel())
                        .thresholdType(sourceRating.getThresholdType())
                        .thresholdValue(sourceRating.getThresholdValue())
                        .rangeMin(sourceRating.getRangeMin())
                        .rangeMax(sourceRating.getRangeMax())
                        .description(sourceRating.getDescription())
                        .color(sourceRating.getColor())
                        .action(sourceRating.getAction())
                        .build();
                    for (CompetitionRatingCondition c : sourceRating.getConditions()) {
                        newRating.getConditions().add(CompetitionRatingCondition.builder().rating(newRating)
                            .assessmentId(assessmentIds.get(c.getAssessmentId())).rangeMin(c.getRangeMin()).rangeMax(c.getRangeMax()).build());
                    }
                    ratingRepository.save(newRating);
                    log.debug("    Copied rating level: {}", newRating.getLevel());
                }
            }
        }

        log.info("Successfully copied {} days from stage {} to stage {}", sourceDays.size(), sourceStageId, targetStageId);
    }

    /**
     * Get list of stages (within same competition) that have assessment structures
     */
    public List<CompetitionStage> getStagesWithStructure(Long competitionId) {
        List<CompetitionStage> allStages = stageRepository.findByCompetitionIdOrderByStageNumberAsc(competitionId);
        return allStages.stream()
            .filter(stage -> assessmentDayRepository.countByStageId(stage.getId()) > 0)
            .collect(java.util.stream.Collectors.toList());
    }

    // ============= DTOs =============

    /**
     * DTO for rating scale level definition
     */
    @lombok.Data
    @lombok.Builder
    public static class RatingScaleDefinition {
        private Integer level; // 1-5
        private ThresholdType thresholdType;
        private java.math.BigDecimal thresholdValue;
        private java.math.BigDecimal rangeMin;
        private java.math.BigDecimal rangeMax;
        private String description;
        private String color;
        private RatingAction action;
        /** Combine scale: one band per assessment; when set, the threshold fields are ignored. */
        private List<ConditionDefinition> conditions;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ConditionDefinition {
        private Long assessmentId;
        private java.math.BigDecimal min;
        private java.math.BigDecimal max;
    }
}
