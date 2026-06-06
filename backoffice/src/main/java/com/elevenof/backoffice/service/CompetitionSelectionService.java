package com.elevenof.backoffice.service;

import com.elevenof.backoffice.model.*;
import com.elevenof.backoffice.repository.CompetitionParticipantRepository;
import com.elevenof.backoffice.repository.CompetitionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service for managing TOP 30 and TOP 11 selection
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CompetitionSelectionService {
    private final CompetitionRepository competitionRepository;
    private final CompetitionParticipantRepository participantRepository;
    private final NotificationService notificationService;

    /**
     * Select TOP 30 participants from regional auditions
     * Updates participant status and sends notifications
     */
    public void selectTop30(Long competitionId, List<Long> participantIds) {
        log.info("Selecting TOP 30 for competition {}: {} participants", competitionId, participantIds.size());

        // Validate exactly 30 participants
        if (participantIds.size() != 30) {
            throw new IllegalArgumentException("Must select exactly 30 participants, got: " + participantIds.size());
        }

        Competition competition = competitionRepository.findById(competitionId)
            .orElseThrow(() -> new IllegalArgumentException("Competition not found: " + competitionId));

        // Get all REGISTERED participants
        List<CompetitionParticipant> registeredParticipants = participantRepository
            .findByCompetitionIdAndStatus(competitionId, ParticipantStatus.REGISTERED);

        Set<Long> selectedIds = Set.copyOf(participantIds);

        // Update statuses
        for (CompetitionParticipant participant : registeredParticipants) {
            if (selectedIds.contains(participant.getId())) {
                // Selected for TOP 30
                participant.setStatus(ParticipantStatus.SELECTED_TOP30);

                // Send notification
                notificationService.sendNotification(
                    participant.getUser().getId(),
                    "COMPETITION_SELECTED_TOP30",
                    Map.of(
                        "fullName", participant.getUser().getFullName() != null ? participant.getUser().getFullName() : "",
                        "competitionTitle", competition.getTitle()
                    ),
                    null
                );
            } else {
                // Not selected - mark as eliminated
                participant.setStatus(ParticipantStatus.ELIMINATED);
            }
        }

        participantRepository.saveAll(registeredParticipants);

        // Update competition phase
        competition.setCurrentPhase("TRAINING_PHASE");
        competition.setStatus(CompetitionStatus.TRAINING_PHASE);
        competitionRepository.save(competition);

        log.info("Successfully selected TOP 30 for competition {}", competitionId);
    }

    /**
     * Select TOP 11 finalists from TOP 30
     * Updates participant status and sends notifications
     */
    public void selectTop11(Long competitionId, List<Long> participantIds) {
        log.info("Selecting TOP 11 for competition {}: {} participants", competitionId, participantIds.size());

        // Validate exactly 11 participants
        if (participantIds.size() != 11) {
            throw new IllegalArgumentException("Must select exactly 11 participants, got: " + participantIds.size());
        }

        Competition competition = competitionRepository.findById(competitionId)
            .orElseThrow(() -> new IllegalArgumentException("Competition not found: " + competitionId));

        // Get all SELECTED_TOP30 participants
        List<CompetitionParticipant> top30Participants = participantRepository
            .findByCompetitionIdAndStatus(competitionId, ParticipantStatus.SELECTED_TOP30);

        if (top30Participants.size() < 11) {
            throw new IllegalStateException("Not enough TOP 30 participants to select TOP 11");
        }

        Set<Long> selectedIds = Set.copyOf(participantIds);

        // Update statuses
        for (CompetitionParticipant participant : top30Participants) {
            if (selectedIds.contains(participant.getId())) {
                // Selected for TOP 11
                participant.setStatus(ParticipantStatus.SELECTED_TOP11);

                // Send notification
                notificationService.sendNotification(
                    participant.getUser().getId(),
                    "COMPETITION_SELECTED_TOP11",
                    Map.of(
                        "fullName", participant.getUser().getFullName() != null ? participant.getUser().getFullName() : "",
                        "competitionTitle", competition.getTitle()
                    ),
                    null
                );
            } else {
                // Not selected for final - mark as eliminated
                participant.setStatus(ParticipantStatus.ELIMINATED);
            }
        }

        participantRepository.saveAll(top30Participants);

        // Update competition phase
        competition.setCurrentPhase("FINAL_PHASE");
        competition.setStatus(CompetitionStatus.FINAL_PHASE);
        competitionRepository.save(competition);

        log.info("Successfully selected TOP 11 for competition {}", competitionId);
    }

    /**
     * Get eligible participants for TOP 30 selection
     * Returns all REGISTERED participants who participated in regional auditions
     */
    public List<CompetitionParticipant> getEligibleForTop30(Long competitionId) {
        return participantRepository.findByCompetitionIdAndStatus(competitionId, ParticipantStatus.REGISTERED);
    }

    /**
     * Get eligible participants for TOP 11 selection
     * Returns all SELECTED_TOP30 participants
     */
    public List<CompetitionParticipant> getEligibleForTop11(Long competitionId) {
        return participantRepository.findByCompetitionIdAndStatus(competitionId, ParticipantStatus.SELECTED_TOP30);
    }
}
