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
            throw new IllegalStateException("Chỉ tài khoản cầu thủ mới đăng ký tham gia được");
        }

        // Same window as the automatic enrollment at sign-up: registration open or regional audition
        if (!isEnrollable(competition)) {
            throw new IllegalStateException("Cuộc thi hiện không nhận đăng ký");
        }

        LocalDate today = LocalDate.now();
        if (competition.getStatus() == CompetitionStatus.REGISTRATION_OPEN) {
            if (competition.getRegistrationStartDate() != null && today.isBefore(competition.getRegistrationStartDate())) {
                throw new IllegalStateException("Chưa đến ngày mở đăng ký");
            }
            if (competition.getRegistrationEndDate() != null && today.isAfter(competition.getRegistrationEndDate())) {
                throw new IllegalStateException("Đã hết hạn đăng ký");
            }
        }

        // Already in: a withdrawn player joins again, anyone else is told they are registered
        Optional<CompetitionParticipant> existing = participantRepository.findByCompetitionIdAndUserId(competitionId, userId);
        if (existing.isPresent()) {
            CompetitionParticipant p = existing.get();
            if (p.getStatus() != ParticipantStatus.WITHDRAWN) {
                throw new IllegalStateException("Bạn đã đăng ký cuộc thi này");
            }
            p.setStatus(ParticipantStatus.REGISTERED);
            p.setRegistrationDate(LocalDateTime.now());
            return participantRepository.save(p);
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

    /** A player can join while registration is open or during the regional audition. */
    public static boolean isEnrollable(Competition competition) {
        return competition.getStatus() == CompetitionStatus.REGISTRATION_OPEN
            || competition.getStatus() == CompetitionStatus.REGIONAL_AUDITION;
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
     * Auto-enroll user in current active competition (called during user registration)
     * Enrolls in any competition with REGISTRATION_OPEN or REGIONAL_AUDITION status
     */
    public void autoEnrollInCurrentCompetitionIfEligible(User user) {
        autoEnrollInCurrentCompetitionIfEligible(user, null);
    }

    public void autoEnrollInCurrentCompetitionIfEligible(User user, Region selectedRegion) {
        if (user.getRole() != User.Role.PLAYER) {
            return;
        }

        Optional<Competition> currentOpt = getCurrentCompetition();
        if (currentOpt.isEmpty()) {
            return;
        }

        Competition competition = currentOpt.get();

        if (!isEnrollable(competition)) {
            return;
        }

        if (participantRepository.existsByCompetitionIdAndUserId(competition.getId(), user.getId())) {
            return;
        }

        CompetitionParticipant participant = CompetitionParticipant.builder()
            .competition(competition)
            .user(user)
            .enrollmentType(EnrollmentType.AUTO_ENROLLED)
            .status(ParticipantStatus.REGISTERED)
            .selectedRegion(selectedRegion)
            .registrationDate(LocalDateTime.now())
            .build();

        participantRepository.save(participant);
        log.info("Auto-enrolled user {} in competition {} (season {}), region {}", user.getId(), competition.getId(), competition.getSeason(), selectedRegion);
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
