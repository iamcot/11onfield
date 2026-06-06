package com.elevenof.backoffice.service;

import com.elevenof.backoffice.model.*;
import com.elevenof.backoffice.repository.CompetitionParticipantRepository;
import com.elevenof.backoffice.repository.CompetitionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service for managing competitions and participant registration
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CompetitionService {
    private final CompetitionRepository competitionRepository;
    private final CompetitionParticipantRepository participantRepository;
    private final NotificationService notificationService;

    /**
     * Get current active competition (not DRAFT or COMPLETED)
     */
    public Optional<Competition> getCurrentCompetition() {
        List<Competition> activeCompetitions = competitionRepository.findByStatusNotInOrderBySeasonDesc(
            List.of(CompetitionStatus.DRAFT, CompetitionStatus.COMPLETED)
        );

        return activeCompetitions.isEmpty() ? Optional.empty() : Optional.of(activeCompetitions.get(0));
    }

    /**
     * Get competition by ID
     */
    public Optional<Competition> getCompetitionById(Long competitionId) {
        return competitionRepository.findById(competitionId);
    }

    /**
     * Get competition by season
     */
    public Optional<Competition> getCompetitionBySeason(Integer season) {
        return competitionRepository.findBySeason(season);
    }

    /**
     * Check if user is participant in competition
     */
    public boolean isUserParticipant(Long userId, Long competitionId) {
        return participantRepository.existsByCompetitionIdAndUserId(competitionId, userId);
    }

    /**
     * Get participant record
     */
    public Optional<CompetitionParticipant> getParticipant(Long userId, Long competitionId) {
        return participantRepository.findByCompetitionIdAndUserId(competitionId, userId);
    }

    /**
     * Manual registration for competition (Season 2+)
     * Validates registration period and creates participant record
     */
    public CompetitionParticipant registerForCompetition(Long userId, Long competitionId, User user) {
        log.info("User {} attempting to register for competition {}", userId, competitionId);

        Competition competition = competitionRepository.findById(competitionId)
            .orElseThrow(() -> new IllegalArgumentException("Competition not found: " + competitionId));

        // Validate user role
        if (user.getRole() != User.Role.PLAYER) {
            throw new IllegalStateException("Only PLAYER users can register for competitions");
        }

        // Validate registration period
        if (competition.getStatus() != CompetitionStatus.REGISTRATION_OPEN) {
            throw new IllegalStateException("Registration is not currently open for this competition");
        }

        LocalDate today = LocalDate.now();
        if (competition.getRegistrationStartDate() != null && today.isBefore(competition.getRegistrationStartDate())) {
            throw new IllegalStateException("Registration has not started yet");
        }
        if (competition.getRegistrationEndDate() != null && today.isAfter(competition.getRegistrationEndDate())) {
            throw new IllegalStateException("Registration period has ended");
        }

        // Check if already registered
        if (participantRepository.existsByCompetitionIdAndUserId(competitionId, userId)) {
            throw new IllegalStateException("User is already registered for this competition");
        }

        // Create participant record
        CompetitionParticipant participant = CompetitionParticipant.builder()
            .competition(competition)
            .user(user)
            .enrollmentType(EnrollmentType.MANUAL_REGISTERED)
            .status(ParticipantStatus.REGISTERED)
            .registrationDate(LocalDateTime.now())
            .build();

        participant = participantRepository.save(participant);

        // Send registration confirmation notification
        notificationService.sendNotification(
            userId,
            "COMPETITION_REGISTERED",
            Map.of(
                "fullName", user.getFullName() != null ? user.getFullName() : "",
                "competitionTitle", competition.getTitle()
            ),
            null
        );

        log.info("User {} successfully registered for competition {}", userId, competitionId);
        return participant;
    }

    /**
     * Withdraw from competition
     */
    public void withdrawFromCompetition(Long userId, Long competitionId) {
        log.info("User {} withdrawing from competition {}", userId, competitionId);

        CompetitionParticipant participant = participantRepository.findByCompetitionIdAndUserId(competitionId, userId)
            .orElseThrow(() -> new IllegalArgumentException("User is not registered for this competition"));

        // Only allow withdrawal if still in REGISTERED status
        if (participant.getStatus() != ParticipantStatus.REGISTERED) {
            throw new IllegalStateException("Cannot withdraw after selection phase has begun");
        }

        participant.setStatus(ParticipantStatus.WITHDRAWN);
        participantRepository.save(participant);

        log.info("User {} successfully withdrawn from competition {}", userId, competitionId);
    }

    /**
     * Get participants by status (admin use)
     */
    public List<CompetitionParticipant> getParticipantsByStatus(Long competitionId, ParticipantStatus status) {
        return participantRepository.findByCompetitionIdAndStatus(competitionId, status);
    }

    /**
     * Get all participants for a competition (admin use)
     */
    public List<CompetitionParticipant> getAllParticipants(Long competitionId) {
        return participantRepository.findByCompetitionId(competitionId);
    }

    /**
     * Auto-enroll user in Season 1 competition (called during user registration)
     * Only for Season 1 during REGISTRATION or REGIONAL_AUDITION phase
     */
    public void autoEnrollInSeason1IfEligible(User user) {
        if (user.getRole() != User.Role.PLAYER) {
            return; // Only PLAYER users are auto-enrolled
        }

        Optional<Competition> season1Opt = competitionRepository.findBySeason(1);
        if (season1Opt.isEmpty()) {
            return; // Season 1 doesn't exist yet
        }

        Competition season1 = season1Opt.get();

        // Only auto-enroll if in REGISTRATION or REGIONAL_AUDITION phase
        if (season1.getStatus() != CompetitionStatus.REGISTRATION_OPEN &&
            season1.getStatus() != CompetitionStatus.REGIONAL_AUDITION) {
            return;
        }

        // Check if already enrolled
        if (participantRepository.existsByCompetitionIdAndUserId(season1.getId(), user.getId())) {
            return;
        }

        // Auto-enroll
        CompetitionParticipant participant = CompetitionParticipant.builder()
            .competition(season1)
            .user(user)
            .enrollmentType(EnrollmentType.AUTO_ENROLLED)
            .status(ParticipantStatus.REGISTERED)
            .registrationDate(LocalDateTime.now())
            .build();

        participantRepository.save(participant);
        log.info("Auto-enrolled user {} in Season 1 competition", user.getId());
    }

    /**
     * Get participant count by status
     */
    public long getParticipantCountByStatus(Long competitionId, ParticipantStatus status) {
        return participantRepository.countByCompetitionIdAndStatus(competitionId, status);
    }

    /**
     * Create new competition (admin)
     */
    public Competition createCompetition(Competition competition) {
        return competitionRepository.save(competition);
    }

    /**
     * Update competition (admin)
     */
    public Competition updateCompetition(Competition competition) {
        return competitionRepository.save(competition);
    }

    /**
     * Get all competitions
     */
    public List<Competition> getAllCompetitions() {
        return competitionRepository.findAll();
    }
}
