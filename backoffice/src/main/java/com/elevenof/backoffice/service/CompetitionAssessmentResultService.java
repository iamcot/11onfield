package com.elevenof.backoffice.service;

import com.elevenof.backoffice.model.*;
import com.elevenof.backoffice.repository.*;
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
 * Service for recording assessment results and calculating scores
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CompetitionAssessmentResultService {

    private final CompetitionAssessmentRepository assessmentRepository;
    private final CompetitionAssessmentStepRepository assessmentStepRepository;
    private final CompetitionAssessmentDayRepository assessmentDayRepository;
    private final CompetitionParticipantRepository participantRepository;
    private final CompetitionAssessmentResultRepository resultRepository;
    private final CompetitionAssessmentStepScoreRepository stepScoreRepository;
    private final CompetitionAssessmentStepRatingRepository ratingRepository;
    private final StageResultRepository stageResultRepository;

    // ============= Result Entry =============

    /**
     * Record a test attempt result for a participant
     */
    public CompetitionAssessmentResult recordAttemptResult(Long assessmentId, Long participantId,
                                                          Integer attemptNumber, BigDecimal resultValue,
                                                          String notes) {
        log.info("Recording attempt result: assessment={}, participant={}, attempt={}, value={}",
            assessmentId, participantId, attemptNumber, resultValue);

        CompetitionAssessment assessment = assessmentRepository.findById(assessmentId)
            .orElseThrow(() -> new IllegalArgumentException("Assessment not found: " + assessmentId));

        CompetitionParticipant participant = participantRepository.findById(participantId)
            .orElseThrow(() -> new IllegalArgumentException("Participant not found: " + participantId));

        // Validate attempt number
        if (attemptNumber < 1 || attemptNumber > assessment.getAttemptsCount()) {
            throw new IllegalArgumentException(
                "Invalid attempt number " + attemptNumber + " (max: " + assessment.getAttemptsCount() + ")");
        }

        // Find existing result or create new
        CompetitionAssessmentResult result = resultRepository
            .findByAssessmentIdAndParticipantIdAndAttemptNumber(assessmentId, participantId, attemptNumber)
            .orElse(CompetitionAssessmentResult.builder()
                .assessment(assessment)
                .participant(participant)
                .attemptNumber(attemptNumber)
                .build());

        result.setResultValue(resultValue);
        result.setNotes(notes);
        result.setRecordedAt(LocalDateTime.now());

        return resultRepository.save(result);
    }

    // ============= Score Calculation =============

    /**
     * Calculate final score for a single assessment (aggregates all attempts)
     * @return Final score after applying scoring method, or null if incomplete
     */
    public BigDecimal calculateAssessmentFinalScore(Long assessmentId, Long participantId) {
        CompetitionAssessment assessment = assessmentRepository.findById(assessmentId)
            .orElseThrow(() -> new IllegalArgumentException("Assessment not found: " + assessmentId));

        List<CompetitionAssessmentResult> attempts = resultRepository
            .findByAssessmentIdAndParticipantIdOrderByAttemptNumberAsc(assessmentId, participantId);

        // Check if all attempts are recorded
        if (attempts.size() < assessment.getAttemptsCount()) {
            log.debug("Incomplete attempts for assessment {}, participant {}: {}/{}",
                assessmentId, participantId, attempts.size(), assessment.getAttemptsCount());
            return null;
        }

        List<BigDecimal> values = attempts.stream()
            .map(CompetitionAssessmentResult::getResultValue)
            .collect(Collectors.toList());

        BigDecimal finalScore = switch (assessment.getScoringMethod()) {
            case BEST_OF -> values.stream().max(BigDecimal::compareTo).orElse(null);
            case SUM -> values.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
            case AVERAGE -> {
                BigDecimal sum = values.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
                yield sum.divide(BigDecimal.valueOf(values.size()), 2, RoundingMode.HALF_UP);
            }
        };

        log.debug("Assessment {} final score for participant {}: {} (method: {})",
            assessmentId, participantId, finalScore, assessment.getScoringMethod());
        return finalScore;
    }

    /**
     * Calculate step score and rating for a participant
     * Aggregates all assessment scores in the step and determines rating level
     */
    public CompetitionAssessmentStepScore calculateStepScore(Long assessmentStepId, Long participantId) {
        log.info("Calculating step score: step={}, participant={}", assessmentStepId, participantId);

        CompetitionAssessmentStep step = assessmentStepRepository.findById(assessmentStepId)
            .orElseThrow(() -> new IllegalArgumentException("Assessment step not found: " + assessmentStepId));

        CompetitionParticipant participant = participantRepository.findById(participantId)
            .orElseThrow(() -> new IllegalArgumentException("Participant not found: " + participantId));

        // Get all assessments for this step
        List<CompetitionAssessment> assessments = assessmentRepository
            .findByAssessmentStepIdOrderByDisplayOrderAsc(assessmentStepId);

        if (assessments.isEmpty()) {
            throw new IllegalArgumentException("No assessments found for step " + assessmentStepId);
        }

        // Calculate final score for each assessment
        List<BigDecimal> assessmentScores = new ArrayList<>();
        for (CompetitionAssessment assessment : assessments) {
            BigDecimal score = calculateAssessmentFinalScore(assessment.getId(), participantId);
            if (score == null) {
                log.warn("Incomplete results for assessment {}, cannot calculate step score yet", assessment.getId());
                return null; // Not all assessments complete
            }
            assessmentScores.add(score);
        }

        // Aggregate step total score (sum of all assessment scores)
        BigDecimal totalScore = assessmentScores.stream()
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Determine rating level if step has rating scale
        Integer ratingLevel = null;
        if (step.getHasRatingScale()) {
            ratingLevel = determineRatingLevel(assessmentStepId, totalScore);
        }

        // Find existing or create new step score record
        CompetitionAssessmentStepScore stepScore = stepScoreRepository
            .findByAssessmentStepIdAndParticipantId(assessmentStepId, participantId)
            .orElse(CompetitionAssessmentStepScore.builder()
                .assessmentStep(step)
                .participant(participant)
                .build());

        stepScore.setTotalScore(totalScore);
        stepScore.setRatingLevel(ratingLevel);
        stepScore.setIsCalculated(true);

        stepScore = stepScoreRepository.save(stepScore);

        log.info("Step score calculated: step={}, participant={}, score={}, rating={}",
            assessmentStepId, participantId, totalScore, ratingLevel);

        return stepScore;
    }

    /**
     * Determine rating level (1-5) based on total score and rating scale
     */
    private Integer determineRatingLevel(Long assessmentStepId, BigDecimal totalScore) {
        List<CompetitionAssessmentStepRating> ratings = ratingRepository
            .findByAssessmentStepIdOrderByLevelDesc(assessmentStepId);

        if (ratings.isEmpty()) {
            log.warn("No rating scale defined for step {}", assessmentStepId);
            return null;
        }

        // Check levels from highest to lowest
        for (CompetitionAssessmentStepRating rating : ratings) {
            boolean matches = switch (rating.getThresholdType()) {
                case EXACT -> totalScore.compareTo(rating.getThresholdValue()) >= 0;
                case RANGE -> totalScore.compareTo(rating.getRangeMin()) >= 0
                           && totalScore.compareTo(rating.getRangeMax()) <= 0;
            };

            if (matches) {
                log.debug("Score {} matches level {} ({})", totalScore, rating.getLevel(), rating.getDescription());
                return rating.getLevel();
            }
        }

        // If no match found, return lowest level
        log.debug("Score {} below all thresholds, assigning lowest level", totalScore);
        return 1;
    }

    /**
     * Get rating description for a given step and level
     */
    public String getRatingDescription(Long assessmentStepId, Integer level) {
        return ratingRepository.findByAssessmentStepIdAndLevel(assessmentStepId, level)
            .map(CompetitionAssessmentStepRating::getDescription)
            .orElse("");
    }

    /**
     * Calculate final stage score for a participant
     * Aggregates all step scores and updates stage result
     */
    public StageResult calculateStageScore(Long stageId, Long participantId) {
        log.info("Calculating stage score: stage={}, participant={}", stageId, participantId);

        // Get all assessment days for this stage
        List<CompetitionAssessmentDay> days = assessmentDayRepository
            .findByStageIdOrderByDisplayOrderAsc(stageId);

        if (days.isEmpty()) {
            throw new IllegalArgumentException("No assessment structure found for stage " + stageId);
        }

        // Collect all step IDs
        List<CompetitionAssessmentStep> steps = days.stream()
            .flatMap(day -> assessmentStepRepository
                .findByAssessmentDayIdOrderByDisplayOrderAsc(day.getId()).stream())
            .collect(Collectors.toList());

        // Calculate all step scores (or retrieve cached)
        List<Map<String, Object>> stepDetailsList = new ArrayList<>();
        BigDecimal totalStepScore = BigDecimal.ZERO;

        for (CompetitionAssessmentStep step : steps) {
            CompetitionAssessmentStepScore stepScore = stepScoreRepository
                .findByAssessmentStepIdAndParticipantId(step.getId(), participantId)
                .orElse(null);

            if (stepScore == null) {
                stepScore = calculateStepScore(step.getId(), participantId);
            }

            if (stepScore == null) {
                log.warn("Incomplete results for step {}, cannot calculate stage score yet", step.getId());
                return null;
            }

            totalStepScore = totalStepScore.add(stepScore.getTotalScore());

            // Build step details while we have access to the step entity
            stepDetailsList.add(Map.of(
                "stepId", step.getId(),
                "stepTitle", step.getTitle(),
                "score", stepScore.getTotalScore(),
                "rating", stepScore.getRatingLevel() != null ? stepScore.getRatingLevel() : "N/A"
            ));
        }

        // Build calculation details JSON
        Map<String, Object> calculationDetails = new HashMap<>();
        calculationDetails.put("stepScores", stepDetailsList);
        calculationDetails.put("totalScore", totalStepScore);
        calculationDetails.put("calculatedAt", LocalDateTime.now().toString());

        // Update or create stage result
        CompetitionStage stage = assessmentDayRepository.findById(days.get(0).getId())
            .map(CompetitionAssessmentDay::getStage)
            .orElseThrow(() -> new IllegalArgumentException("Stage not found: " + stageId));

        CompetitionParticipant participant = participantRepository.findById(participantId)
            .orElseThrow(() -> new IllegalArgumentException("Participant not found: " + participantId));

        StageResult stageResult = stageResultRepository
            .findByStageIdAndParticipantId(stageId, participantId)
            .orElse(StageResult.builder()
                .stage(stage)
                .participant(participant)
                .isPublic(false)
                .build());

        stageResult.setScore(totalStepScore);
        stageResult.setIsCalculated(true);

        // Convert calculationDetails to JSON string
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            stageResult.setCalculationDetails(mapper.writeValueAsString(calculationDetails));
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            log.error("Failed to serialize calculation details", e);
            stageResult.setCalculationDetails("{}");
        }

        stageResult = stageResultRepository.save(stageResult);

        log.info("Stage score calculated: stage={}, participant={}, score={}",
            stageId, participantId, totalStepScore);

        return stageResult;
    }

    /**
     * Recalculate all scores for a stage (useful after data corrections)
     */
    public void recalculateAllScores(Long stageId) {
        log.info("Recalculating all scores for stage {}", stageId);

        // Get all participants with results in this stage
        List<CompetitionAssessmentResult> allResults = resultRepository.findAll().stream()
            .filter(r -> {
                CompetitionAssessmentStep step = r.getAssessment().getAssessmentStep();
                CompetitionAssessmentDay day = step.getAssessmentDay();
                return day.getStage().getId().equals(stageId);
            })
            .collect(Collectors.toList());

        Set<Long> participantIds = allResults.stream()
            .map(r -> r.getParticipant().getId())
            .collect(Collectors.toSet());

        log.info("Found {} participants to recalculate", participantIds.size());

        for (Long participantId : participantIds) {
            try {
                calculateStageScore(stageId, participantId);
            } catch (Exception e) {
                log.error("Failed to recalculate score for participant {}: {}", participantId, e.getMessage());
            }
        }

        log.info("Recalculation complete for stage {}", stageId);
    }

    // ============= Retrieval =============

    /**
     * Get all results for a participant across all assessments in a stage
     */
    public ParticipantAssessmentBreakdown getParticipantResults(Long stageId, Long participantId) {
        log.info("Getting participant results: stage={}, participant={}", stageId, participantId);

        List<CompetitionAssessmentDay> days = assessmentDayRepository
            .findByStageIdOrderByDisplayOrderAsc(stageId);

        ParticipantAssessmentBreakdown breakdown = new ParticipantAssessmentBreakdown();
        breakdown.setStageId(stageId);
        breakdown.setParticipantId(participantId);

        for (CompetitionAssessmentDay day : days) {
            for (CompetitionAssessmentStep step : day.getAssessmentSteps()) {
                for (CompetitionAssessment assessment : step.getAssessments()) {
                    List<CompetitionAssessmentResult> attempts = resultRepository
                        .findByAssessmentIdAndParticipantIdOrderByAttemptNumberAsc(
                            assessment.getId(), participantId);

                    BigDecimal finalScore = calculateAssessmentFinalScore(assessment.getId(), participantId);

                    // Add to breakdown (implementation depends on DTO structure)
                }

                CompetitionAssessmentStepScore stepScore = stepScoreRepository
                    .findByAssessmentStepIdAndParticipantId(step.getId(), participantId)
                    .orElse(null);

                // Add step score to breakdown
            }
        }

        return breakdown;
    }

    // ============= DTOs =============

    @lombok.Data
    public static class ParticipantAssessmentBreakdown {
        private Long stageId;
        private Long participantId;
        // Add more fields as needed for UI display
    }
}
