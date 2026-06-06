package com.elevenof.backoffice.controller.api;

import com.elevenof.backoffice.model.*;
import com.elevenof.backoffice.service.CompetitionAssessmentResultService;
import com.elevenof.backoffice.service.CompetitionAssessmentStructureService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * REST API for managing competition assessment structure and results
 */
@RestController
@RequestMapping("/admin/api/competitions/{competitionId}/stages/{stageNumber}")
@RequiredArgsConstructor
@Slf4j
public class CompetitionAssessmentController {

    private final CompetitionAssessmentStructureService structureService;
    private final CompetitionAssessmentResultService resultService;
    private final com.elevenof.backoffice.repository.CompetitionStageRepository stageRepository;
    private final com.elevenof.backoffice.repository.CompetitionParticipantRepository participantRepository;

    // ============= Assessment Structure APIs =============

    /**
     * Get full assessment structure for a stage
     */
    @GetMapping("/assessment-structure")
    public ResponseEntity<List<CompetitionAssessmentDay>> getAssessmentStructure(
            @PathVariable Long competitionId,
            @PathVariable Integer stageNumber) {

        CompetitionStage stage = getStage(competitionId, stageNumber);
        List<CompetitionAssessmentDay> structure = structureService.getFullAssessmentStructure(stage.getId());

        return ResponseEntity.ok(structure);
    }

    /**
     * Create a new assessment day
     */
    @PostMapping("/assessment-days")
    public ResponseEntity<CompetitionAssessmentDay> createAssessmentDay(
            @PathVariable Long competitionId,
            @PathVariable Integer stageNumber,
            @RequestBody AssessmentDayRequest request) {

        CompetitionStage stage = getStage(competitionId, stageNumber);

        CompetitionAssessmentDay day = structureService.createAssessmentDay(
            stage.getId(),
            request.getDayNumber(),
            request.getTitle(),
            request.getDescription(),
            request.getAssessmentDate(),
            request.getDisplayOrder()
        );

        return ResponseEntity.ok(day);
    }

    /**
     * Create a new assessment step
     */
    @PostMapping("/assessment-days/{dayId}/steps")
    public ResponseEntity<CompetitionAssessmentStep> createAssessmentStep(
            @PathVariable Long competitionId,
            @PathVariable Integer stageNumber,
            @PathVariable Long dayId,
            @RequestBody AssessmentStepRequest request) {

        CompetitionAssessmentStep step = structureService.createAssessmentStep(
            dayId,
            request.getStepNumber(),
            request.getTitle(),
            request.getDescription(),
            request.getDisplayOrder(),
            request.getHasRatingScale()
        );

        return ResponseEntity.ok(step);
    }

    /**
     * Create a new assessment (test)
     */
    @PostMapping("/assessment-steps/{stepId}/assessments")
    public ResponseEntity<CompetitionAssessment> createAssessment(
            @PathVariable Long competitionId,
            @PathVariable Integer stageNumber,
            @PathVariable Long stepId,
            @RequestBody AssessmentRequest request) {

        CompetitionAssessment assessment = structureService.createAssessment(
            stepId,
            request.getAssessmentNumber(),
            request.getTitle(),
            request.getDescription(),
            request.getUnit(),
            request.getAttemptsCount(),
            request.getScoringMethod(),
            request.getDisplayOrder()
        );

        return ResponseEntity.ok(assessment);
    }

    /**
     * Get rating scale for a step
     */
    @GetMapping("/assessment-steps/{stepId}/rating-scale")
    public ResponseEntity<List<CompetitionAssessmentStepRating>> getRatingScale(
            @PathVariable Long competitionId,
            @PathVariable Integer stageNumber,
            @PathVariable Long stepId) {

        List<CompetitionAssessmentStepRating> ratings =
            structureService.getRatingScale(stepId);

        return ResponseEntity.ok(ratings);
    }

    /**
     * Create or update rating scale for a step (all 5 levels at once)
     */
    @PutMapping("/assessment-steps/{stepId}/rating-scale")
    public ResponseEntity<List<CompetitionAssessmentStepRating>> updateRatingScale(
            @PathVariable Long competitionId,
            @PathVariable Integer stageNumber,
            @PathVariable Long stepId,
            @RequestBody RatingScaleRequest request) {

        List<CompetitionAssessmentStructureService.RatingScaleDefinition> definitions =
            request.getLevels().stream()
                .map(level -> CompetitionAssessmentStructureService.RatingScaleDefinition.builder()
                    .level(level.getLevel())
                    .thresholdType(level.getThresholdType())
                    .thresholdValue(level.getThresholdValue())
                    .rangeMin(level.getRangeMin())
                    .rangeMax(level.getRangeMax())
                    .description(level.getDescription())
                    .build())
                .toList();

        List<CompetitionAssessmentStepRating> ratings =
            structureService.createOrUpdateRatingScale(stepId, definitions);

        return ResponseEntity.ok(ratings);
    }

    /**
     * Delete assessment day (cascade deletes everything under it)
     */
    @DeleteMapping("/assessment-days/{dayId}")
    public ResponseEntity<Void> deleteAssessmentDay(
            @PathVariable Long competitionId,
            @PathVariable Integer stageNumber,
            @PathVariable Long dayId) {

        structureService.deleteAssessmentDay(dayId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Delete assessment step (cascade deletes everything under it)
     */
    @DeleteMapping("/assessment-steps/{stepId}")
    public ResponseEntity<Void> deleteAssessmentStep(
            @PathVariable Long competitionId,
            @PathVariable Integer stageNumber,
            @PathVariable Long stepId) {

        structureService.deleteAssessmentStep(stepId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Delete assessment
     */
    @DeleteMapping("/assessments/{assessmentId}")
    public ResponseEntity<Void> deleteAssessment(
            @PathVariable Long competitionId,
            @PathVariable Integer stageNumber,
            @PathVariable Long assessmentId) {

        structureService.deleteAssessment(assessmentId);
        return ResponseEntity.noContent().build();
    }

    // ============= Result Entry APIs =============

    /**
     * Record a test attempt result
     */
    @PostMapping("/assessments/{assessmentId}/participants/{participantId}/attempts/{attemptNumber}")
    public ResponseEntity<CompetitionAssessmentResult> recordAttemptResult(
            @PathVariable Long competitionId,
            @PathVariable Integer stageNumber,
            @PathVariable Long assessmentId,
            @PathVariable Long participantId,
            @PathVariable Integer attemptNumber,
            @RequestBody AttemptResultRequest request) {

        CompetitionAssessmentResult result = resultService.recordAttemptResult(
            assessmentId,
            participantId,
            attemptNumber,
            request.getResultValue(),
            request.getNotes()
        );

        return ResponseEntity.ok(result);
    }

    /**
     * Calculate step score for a participant
     */
    @PostMapping("/assessment-steps/{stepId}/participants/{participantId}/calculate")
    public ResponseEntity<StepScoreDTO> calculateStepScore(
            @PathVariable Long competitionId,
            @PathVariable Integer stageNumber,
            @PathVariable Long stepId,
            @PathVariable Long participantId) {

        CompetitionAssessmentStepScore score = resultService.calculateStepScore(stepId, participantId);

        if (score == null) {
            return ResponseEntity.badRequest().build(); // Incomplete results
        }

        // Get rating description if rating level exists
        String ratingDescription = "";
        if (score.getRatingLevel() != null) {
            ratingDescription = resultService.getRatingDescription(stepId, score.getRatingLevel());
        }

        // Map to DTO
        StepScoreDTO dto = new StepScoreDTO();
        dto.setId(score.getId());
        dto.setTotalScore(score.getTotalScore());
        dto.setRatingLevel(score.getRatingLevel());
        dto.setRatingDescription(ratingDescription);

        return ResponseEntity.ok(dto);
    }

    /**
     * Calculate final stage score for a participant
     */
    @PostMapping("/participants/{participantId}/calculate-stage-score")
    public ResponseEntity<StageResult> calculateStageScore(
            @PathVariable Long competitionId,
            @PathVariable Integer stageNumber,
            @PathVariable Long participantId) {

        CompetitionStage stage = getStage(competitionId, stageNumber);
        StageResult result = resultService.calculateStageScore(stage.getId(), participantId);

        if (result == null) {
            return ResponseEntity.badRequest().build(); // Incomplete results
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Recalculate all scores for a stage
     */
    @PostMapping("/recalculate")
    public ResponseEntity<Void> recalculateAllScores(
            @PathVariable Long competitionId,
            @PathVariable Integer stageNumber) {

        CompetitionStage stage = getStage(competitionId, stageNumber);
        resultService.recalculateAllScores(stage.getId());

        return ResponseEntity.ok().build();
    }

    /**
     * Get all participants for a competition stage
     */
    @GetMapping("/participants")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<List<ParticipantDTO>> getParticipants(
            @PathVariable Long competitionId,
            @PathVariable Integer stageNumber) {

        // Get all registered participants for this competition
        List<CompetitionParticipant> participantList = participantRepository.findByCompetitionId(competitionId);

        // Map to DTOs within transaction to avoid lazy loading issues
        List<ParticipantDTO> participants = participantList.stream()
            .map(p -> {
                // Force load user to avoid lazy proxy
                User user = p.getUser();
                String fullName = user.getFullName(); // Force initialization

                ParticipantDTO dto = new ParticipantDTO();
                dto.setId(p.getId());
                dto.setUserId(user.getId());
                dto.setFullName(fullName);
                dto.setPhone(user.getPhone());
                dto.setAvatar(user.getAvatar());
                dto.setSelectedRegion(p.getSelectedRegion() != null ? p.getSelectedRegion().name() : null);
                return dto;
            })
            .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(participants);
    }

    /**
     * Get participant results breakdown
     */
    @GetMapping("/participants/{participantId}/results")
    public ResponseEntity<CompetitionAssessmentResultService.ParticipantAssessmentBreakdown> getParticipantResults(
            @PathVariable Long competitionId,
            @PathVariable Integer stageNumber,
            @PathVariable Long participantId) {

        CompetitionStage stage = getStage(competitionId, stageNumber);
        CompetitionAssessmentResultService.ParticipantAssessmentBreakdown breakdown =
            resultService.getParticipantResults(stage.getId(), participantId);

        return ResponseEntity.ok(breakdown);
    }

    // ============= Copy Structure Operations =============

    /**
     * Get list of stages with assessment structures (for copy source selection)
     */
    @GetMapping("/available-source-stages")
    public ResponseEntity<List<StageInfoDTO>> getAvailableSourceStages(
            @PathVariable Long competitionId,
            @PathVariable Integer stageNumber) {

        CompetitionStage currentStage = getStage(competitionId, stageNumber);
        List<CompetitionStage> stagesWithStructure = structureService.getStagesWithStructure(competitionId);

        // Exclude current stage
        List<StageInfoDTO> result = stagesWithStructure.stream()
            .filter(s -> !s.getId().equals(currentStage.getId()))
            .map(s -> {
                StageInfoDTO dto = new StageInfoDTO();
                dto.setStageNumber(s.getStageNumber());
                dto.setTitle(s.getTitle());
                dto.setStageType(s.getStageType().name());
                dto.setRegion(s.getRegion() != null ? s.getRegion().name() : null);
                return dto;
            })
            .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /**
     * Copy assessment structure from another stage
     */
    @PostMapping("/copy-from/{sourceStageNumber}")
    public ResponseEntity<Void> copyStructure(
            @PathVariable Long competitionId,
            @PathVariable Integer stageNumber,
            @PathVariable Integer sourceStageNumber) {

        CompetitionStage sourceStage = getStage(competitionId, sourceStageNumber);
        CompetitionStage targetStage = getStage(competitionId, stageNumber);

        structureService.copyStructureFromStage(sourceStage.getId(), targetStage.getId());

        return ResponseEntity.ok().build();
    }

    // ============= Helper Methods =============

    private CompetitionStage getStage(Long competitionId, Integer stageNumber) {
        return stageRepository.findByCompetitionIdAndStageNumber(competitionId, stageNumber)
            .orElseThrow(() -> new IllegalArgumentException(
                "Stage not found: competition=" + competitionId + ", stage=" + stageNumber));
    }

    // ============= Request DTOs =============

    @Data
    public static class AssessmentDayRequest {
        private Integer dayNumber;
        private String title;
        private String description;
        private LocalDate assessmentDate;
        private Integer displayOrder;
    }

    @Data
    public static class AssessmentStepRequest {
        private Integer stepNumber;
        private String title;
        private String description;
        private Integer displayOrder;
        private Boolean hasRatingScale;
    }

    @Data
    public static class AssessmentRequest {
        private Integer assessmentNumber;
        private String title;
        private String description;
        private String unit;
        private Integer attemptsCount;
        private ScoringMethod scoringMethod;
        private Integer displayOrder;
    }

    @Data
    public static class RatingScaleRequest {
        private List<RatingLevelRequest> levels;
    }

    @Data
    public static class RatingLevelRequest {
        private Integer level;
        private ThresholdType thresholdType;
        private BigDecimal thresholdValue;
        private BigDecimal rangeMin;
        private BigDecimal rangeMax;
        private String description;
    }

    @Data
    public static class AttemptResultRequest {
        private BigDecimal resultValue;
        private String notes;
    }

    @Data
    public static class ParticipantDTO {
        private Long id;
        private Long userId;
        private String fullName;
        private String phone;
        private String avatar;
        private String selectedRegion;
    }

    @Data
    public static class StepScoreDTO {
        private Long id;
        private BigDecimal totalScore;
        private Integer ratingLevel;
        private String ratingDescription;
    }

    @Data
    public static class StageInfoDTO {
        private Integer stageNumber;
        private String title;
        private String stageType;
        private String region;
    }
}
