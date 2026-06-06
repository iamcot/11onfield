package com.elevenof.backoffice.service;

import com.elevenof.backoffice.model.*;
import com.elevenof.backoffice.repository.CompetitionParticipantRepository;
import com.elevenof.backoffice.repository.CompetitionStageRepository;
import com.elevenof.backoffice.repository.StageResultRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for managing stage results and leaderboard
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class StageResultService {
    private final StageResultRepository stageResultRepository;
    private final CompetitionStageRepository stageRepository;
    private final CompetitionParticipantRepository participantRepository;
    private final NotificationService notificationService;

    /**
     * Update or create stage result (admin)
     * Handles both regional auditions and training episodes
     */
    public StageResult updateStageResult(Long stageId, Long participantId, BigDecimal score,
                                         Integer rankPosition, String performanceNotes, String videoUrl) {
        log.info("Updating stage result: stageId={}, participantId={}, score={}, rank={}",
            stageId, participantId, score, rankPosition);

        CompetitionStage stage = stageRepository.findById(stageId)
            .orElseThrow(() -> new IllegalArgumentException("Stage not found: " + stageId));

        CompetitionParticipant participant = participantRepository.findById(participantId)
            .orElseThrow(() -> new IllegalArgumentException("Participant not found: " + participantId));

        // Find existing result or create new one
        StageResult result = stageResultRepository.findByStageIdAndParticipantId(stageId, participantId)
            .orElse(StageResult.builder()
                .stage(stage)
                .participant(participant)
                .build());

        result.setScore(score);
        result.setRankPosition(rankPosition);
        result.setPerformanceNotes(performanceNotes);
        result.setVideoUrl(videoUrl);
        result.setIsPublic(stage.getIsPublicScoring()); // Inherit from stage

        result = stageResultRepository.save(result);

        // Send notification only for public results (regional auditions and final)
        if (stage.getIsPublicScoring()) {
            User user = participant.getUser();
            notificationService.sendNotification(
                user.getId(),
                "COMPETITION_RESULT_POSTED",
                Map.of(
                    "fullName", user.getFullName() != null ? user.getFullName() : "",
                    "stageTitle", stage.getTitle(),
                    "score", score != null ? score.toString() : "N/A",
                    "rank", rankPosition != null ? rankPosition.toString() : "N/A"
                ),
                null
            );
        }

        log.info("Successfully updated stage result for participant {}", participantId);
        return result;
    }

    /**
     * Get leaderboard for a competition with optional region filter
     * Returns ranked list of participants with aggregated scores
     */
    public List<LeaderboardEntry> getLeaderboard(Long competitionId, Region region) {
        log.info("Getting leaderboard for competition {}, region filter: {}", competitionId, region);

        // Determine visible participants based on competition phase
        Competition competition = stageRepository.findByCompetitionIdOrderByStageNumberAsc(competitionId)
            .stream()
            .findFirst()
            .map(CompetitionStage::getCompetition)
            .orElseThrow(() -> new IllegalArgumentException("Competition not found"));

        List<ParticipantStatus> visibleStatuses = getVisibleStatusesForPhase(competition.getStatus());

        // Get participants with status and region filter
        List<CompetitionParticipant> participants = participantRepository
            .findByCompetitionAndStatusesAndRegion(competitionId, visibleStatuses, region);

        if (participants.isEmpty()) {
            return Collections.emptyList();
        }

        // Get participant IDs
        List<Long> participantIds = participants.stream()
            .map(CompetitionParticipant::getId)
            .collect(Collectors.toList());

        // Aggregate scores (only public results)
        List<Object[]> scoreResults = stageResultRepository.aggregateScores(competitionId, participantIds);

        // Map participant ID to total score
        Map<Long, BigDecimal> scoreMap = new HashMap<>();
        for (Object[] row : scoreResults) {
            Long participantId = (Long) row[0];
            BigDecimal totalScore = (BigDecimal) row[1];
            scoreMap.put(participantId, totalScore);
        }

        // Build leaderboard entries
        List<LeaderboardEntry> entries = participants.stream()
            .map(participant -> {
                BigDecimal totalScore = scoreMap.getOrDefault(participant.getId(), BigDecimal.ZERO);
                return LeaderboardEntry.builder()
                    .participantId(participant.getId())
                    .userId(participant.getUser().getId())
                    .userProfileId(participant.getUser().getUserid())
                    .fullName(participant.getUser().getFullName())
                    .avatar(participant.getUser().getAvatar())
                    .totalScore(totalScore)
                    .selectedRegion(participant.getSelectedRegion())
                    .build();
            })
            .sorted(Comparator.comparing(LeaderboardEntry::getTotalScore).reversed())
            .collect(Collectors.toList());

        // Assign ranks
        for (int i = 0; i < entries.size(); i++) {
            entries.get(i).setRank(i + 1);
        }

        log.info("Leaderboard generated with {} entries", entries.size());
        return entries;
    }

    /**
     * Get all results for a participant (including internal training scores)
     */
    public List<StageResult> getMyResults(Long participantId) {
        return stageResultRepository.findByParticipantIdOrderByStageStageNumberAsc(participantId);
    }

    /**
     * Get results for a specific stage (admin view)
     */
    public List<StageResult> getStageResults(Long stageId) {
        return stageResultRepository.findByStageIdOrderByRankPositionAsc(stageId);
    }

    /**
     * Get public results for a stage (for leaderboard display)
     */
    public List<StageResult> getPublicStageResults(Long stageId) {
        return stageResultRepository.findByStageIdAndIsPublicTrueOrderByRankPositionAsc(stageId);
    }

    /**
     * Determine which participant statuses should be visible based on competition phase
     */
    private List<ParticipantStatus> getVisibleStatusesForPhase(CompetitionStatus status) {
        return switch (status) {
            case REGISTRATION_OPEN, REGIONAL_AUDITION, SELECTING_TOP30 ->
                List.of(ParticipantStatus.REGISTERED);
            case TRAINING_PHASE ->
                List.of(ParticipantStatus.SELECTED_TOP30);
            case FINAL_PHASE, COMPLETED ->
                List.of(ParticipantStatus.SELECTED_TOP11);
            default ->
                Collections.emptyList();
        };
    }

    /**
     * Leaderboard Entry DTO (inner class for convenience)
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class LeaderboardEntry {
        private Integer rank;
        private Long participantId;
        private Long userId;
        private String userProfileId;
        private String fullName;
        private String avatar;
        private BigDecimal totalScore;
        private Region selectedRegion;
    }
}
