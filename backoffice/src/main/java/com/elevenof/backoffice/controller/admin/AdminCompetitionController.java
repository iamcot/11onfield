package com.elevenof.backoffice.controller.admin;

import com.elevenof.backoffice.dto.request.SelectionRequest;
import com.elevenof.backoffice.dto.request.StageResultUpdateRequest;
import com.elevenof.backoffice.dto.response.*;
import com.elevenof.backoffice.dto.response.AdminParticipantDTO;
import com.elevenof.backoffice.model.*;
import com.elevenof.backoffice.repository.CompetitionStageRepository;
import com.elevenof.backoffice.service.CompetitionSelectionService;
import com.elevenof.backoffice.service.CompetitionService;
import com.elevenof.backoffice.service.StageResultService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Admin API Controller for Competition Management
 * Handles result entry, TOP 30/11 selection, and admin operations
 */
@RestController
@RequestMapping("/admin/api/competitions")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminCompetitionController {

    private final CompetitionService competitionService;
    private final CompetitionSelectionService selectionService;
    private final StageResultService stageResultService;
    private final CompetitionStageRepository stageRepository;

    /**
     * Get all participants for a competition
     */
    @GetMapping("/{id}/participants")
    public ResponseEntity<List<AdminParticipantDTO>> getAllParticipants(@PathVariable Long id) {
        List<CompetitionParticipant> participants = competitionService.getAllParticipants(id);

        List<AdminParticipantDTO> dtos = participants.stream()
            .map(participant -> AdminParticipantDTO.builder()
                .id(participant.getId())
                .userId(participant.getUser().getId())
                .fullName(participant.getUser().getFullName())
                .avatar(participant.getUser().getAvatar())
                .status(participant.getStatus().name())
                .enrollmentType(participant.getEnrollmentType().name())
                .selectedRegion(participant.getSelectedRegion() != null ?
                    participant.getSelectedRegion().name() : null)
                .registrationDate(participant.getRegistrationDate())
                .build())
            .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    /**
     * Get results for a specific stage (admin view)
     */
    @GetMapping("/{id}/stages/{stageNumber}/results")
    public ResponseEntity<List<StageResultDTO>> getStageResults(
            @PathVariable Long id,
            @PathVariable Integer stageNumber) {

        CompetitionStage stage = stageRepository.findByCompetitionIdAndStageNumber(id, stageNumber)
            .orElse(null);

        if (stage == null) {
            return ResponseEntity.notFound().build();
        }

        List<StageResult> results = stageResultService.getStageResults(stage.getId());

        List<StageResultDTO> dtos = results.stream()
            .map(result -> StageResultDTO.builder()
                .id(result.getId())
                .stageId(result.getStage().getId())
                .stageTitle(result.getStage().getTitle())
                .stageNumber(result.getStage().getStageNumber())
                .userId(result.getParticipant().getUser().getId())
                .fullName(result.getParticipant().getUser().getFullName())
                .avatar(result.getParticipant().getUser().getAvatar())
                .score(result.getScore())
                .rankPosition(result.getRankPosition())
                .performanceNotes(result.getPerformanceNotes())
                .videoUrl(result.getVideoUrl())
                .isPublic(result.getIsPublic())
                .build())
            .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    /**
     * Update stage result for a participant
     */
    @PutMapping("/{id}/stages/{stageNumber}/results/{participantId}")
    public ResponseEntity<String> updateStageResult(
            @PathVariable Long id,
            @PathVariable Integer stageNumber,
            @PathVariable Long participantId,
            @RequestBody StageResultUpdateRequest request) {

        CompetitionStage stage = stageRepository.findByCompetitionIdAndStageNumber(id, stageNumber)
            .orElse(null);

        if (stage == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            stageResultService.updateStageResult(
                stage.getId(),
                participantId,
                request.getScore(),
                request.getRankPosition(),
                request.getPerformanceNotes(),
                request.getVideoUrl()
            );

            return ResponseEntity.ok("Cập nhật kết quả thành công");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Get eligible participants for TOP 30 selection
     */
    @GetMapping("/{id}/select-top30/eligible")
    public ResponseEntity<List<AdminParticipantDTO>> getEligibleForTop30(@PathVariable Long id) {
        List<CompetitionParticipant> participants = selectionService.getEligibleForTop30(id);

        List<AdminParticipantDTO> dtos = participants.stream()
            .map(participant -> {
                // Get total score for sorting
                java.math.BigDecimal totalScore = stageResultService.getLeaderboard(id, null)
                    .stream()
                    .filter(entry -> entry.getParticipantId().equals(participant.getId()))
                    .findFirst()
                    .map(StageResultService.LeaderboardEntry::getTotalScore)
                    .orElse(java.math.BigDecimal.ZERO);

                return AdminParticipantDTO.builder()
                    .id(participant.getId())
                    .userId(participant.getUser().getId())
                    .fullName(participant.getUser().getFullName())
                    .avatar(participant.getUser().getAvatar())
                    .status(participant.getStatus().name())
                    .selectedRegion(participant.getSelectedRegion() != null ?
                        participant.getSelectedRegion().name() : null)
                    .totalScore(totalScore)
                    .build();
            })
            .sorted((a, b) -> b.getTotalScore().compareTo(a.getTotalScore()))
            .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    /**
     * Select TOP 30 participants
     */
    @PostMapping("/{id}/select-top30")
    public ResponseEntity<String> selectTop30(
            @PathVariable Long id,
            @RequestBody SelectionRequest request) {

        try {
            selectionService.selectTop30(id, request.getParticipantIds());
            return ResponseEntity.ok("Đã chọn TOP 30 thành công");
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Get eligible participants for TOP 11 selection
     */
    @GetMapping("/{id}/select-top11/eligible")
    public ResponseEntity<List<AdminParticipantDTO>> getEligibleForTop11(@PathVariable Long id) {
        List<CompetitionParticipant> participants = selectionService.getEligibleForTop11(id);

        List<AdminParticipantDTO> dtos = participants.stream()
            .map(participant -> AdminParticipantDTO.builder()
                .id(participant.getId())
                .userId(participant.getUser().getId())
                .fullName(participant.getUser().getFullName())
                .avatar(participant.getUser().getAvatar())
                .status(participant.getStatus().name())
                .selectedRegion(participant.getSelectedRegion() != null ?
                    participant.getSelectedRegion().name() : null)
                .build())
            .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    /**
     * Select TOP 11 finalists
     */
    @PostMapping("/{id}/select-top11")
    public ResponseEntity<String> selectTop11(
            @PathVariable Long id,
            @RequestBody SelectionRequest request) {

        try {
            selectionService.selectTop11(id, request.getParticipantIds());
            return ResponseEntity.ok("Đã chọn TOP 11 thành công");
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
