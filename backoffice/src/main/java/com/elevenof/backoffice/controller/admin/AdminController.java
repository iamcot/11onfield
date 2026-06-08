package com.elevenof.backoffice.controller.admin;

import com.elevenof.backoffice.model.Address;
import com.elevenof.backoffice.model.Event;
import com.elevenof.backoffice.model.Player;
import com.elevenof.backoffice.model.PlayerAchievement;
import com.elevenof.backoffice.model.PlayerHighlight;
import com.elevenof.backoffice.model.Province;
import com.elevenof.backoffice.model.User;
import com.elevenof.backoffice.repository.AddressRepository;
import com.elevenof.backoffice.repository.EventRepository;
import com.elevenof.backoffice.repository.PlayerAchievementRepository;
import com.elevenof.backoffice.repository.PlayerHighlightRepository;
import com.elevenof.backoffice.repository.PlayerRepository;
import com.elevenof.backoffice.repository.PlayerSocialRepository;
import com.elevenof.backoffice.repository.ProvinceRepository;
import com.elevenof.backoffice.repository.UserRepository;
import com.elevenof.backoffice.service.EventService;
import com.elevenof.backoffice.service.S3Service;
import com.elevenof.backoffice.specification.EventSpecification;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * Admin Dashboard Controller
 * Handles admin panel navigation and dashboard views
 */
@Controller
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final PlayerRepository playerRepository;
    private final UserRepository userRepository;
    private final ProvinceRepository provinceRepository;
    private final AddressRepository addressRepository;
    private final EventRepository eventRepository;
    private final EventService eventService;
    private final S3Service s3Service;
    private final com.elevenof.backoffice.service.PlayerAttributeTypeService playerAttributeTypeService;
    private final com.elevenof.backoffice.service.PlayerAttributeService playerAttributeService;
    private final com.elevenof.backoffice.repository.PlayerAttributeRepository playerAttributeRepository;
    private final PlayerAchievementRepository playerAchievementRepository;
    private final PlayerHighlightRepository playerHighlightRepository;
    private final PlayerSocialRepository playerSocialRepository;
    private final com.elevenof.backoffice.service.AuthenticationService authenticationService;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final com.elevenof.backoffice.service.CompetitionAssessmentResultService assessmentResultService;
    private final com.elevenof.backoffice.repository.CompetitionAssessmentResultRepository assessmentResultRepository;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;
    private final com.elevenof.backoffice.repository.NotificationScenarioRepository notificationScenarioRepository;
    private final com.elevenof.backoffice.service.NotificationTemplateService notificationTemplateService;
    private final com.elevenof.backoffice.repository.CompetitionRepository competitionRepository;
    private final com.elevenof.backoffice.repository.CompetitionParticipantRepository competitionParticipantRepository;
    private final com.elevenof.backoffice.repository.CompetitionNewsRepository competitionNewsRepository;
    private final com.elevenof.backoffice.repository.CompetitionSponsorRepository competitionSponsorRepository;
    private final com.elevenof.backoffice.repository.CompetitionStageRepository competitionStageRepository;
    private final com.elevenof.backoffice.repository.CompetitionAssessmentDayRepository assessmentDayRepository;
    private final com.elevenof.backoffice.repository.CompetitionAssessmentStepRepository assessmentStepRepository;
    private final com.elevenof.backoffice.repository.CompetitionAssessmentRepository assessmentRepository;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    /**
     * Admin dashboard homepage
     */
    @GetMapping({"/", "/dashboard"})
    public String dashboard(Model model, jakarta.servlet.http.HttpSession session) {
        String errorMsg = (String) session.getAttribute("errorMessage");
        if (errorMsg != null) {
            model.addAttribute("errorMessage", errorMsg);
            session.removeAttribute("errorMessage");
        }
        // Count statistics from database
        long totalPlayers = playerRepository.count();
        long totalUsers = userRepository.count();

        // Count active events (excluding DELETED events)
        long totalEvents = eventRepository.countActiveEvents();

        // For now, matches are 0 (will be implemented later)
        long totalMatches = 0;

        // Fetch upcoming events (limit to 5 for dashboard display)
        List<Event> upcomingEvents = eventRepository.findUpcomingEvents().stream()
            .limit(5)
            .toList();

        model.addAttribute("title", "Tổng quan");
        model.addAttribute("totalPlayers", totalPlayers);
        model.addAttribute("totalMatches", totalMatches);
        model.addAttribute("totalEvents", totalEvents);
        model.addAttribute("totalUsers", totalUsers);
        model.addAttribute("upcomingEvents", upcomingEvents);

        return "admin/dashboard";
    }

    /**
     * Competitions management page
     */
    @GetMapping("/competitions")
    public String competitions(Model model) {
        List<com.elevenof.backoffice.model.Competition> competitions =
            competitionRepository.findAll();

        java.util.Map<Long, Long> counts = new java.util.HashMap<>();
        for (com.elevenof.backoffice.model.Competition c : competitions) {
            counts.put(c.getId(), competitionParticipantRepository.countByCompetitionId(c.getId()));
        }

        model.addAttribute("title", "Quản lý cuộc thi");
        model.addAttribute("competitions", competitions);
        model.addAttribute("competitionParticipantCounts", counts);
        model.addAttribute("frontendUrl", frontendUrl);

        return "admin/competitions";
    }

    /**
     * Competition participants management page
     */
    @GetMapping("/competitions/{id}/participants")
    public String competitionParticipants(@PathVariable Long id, Model model) {
        com.elevenof.backoffice.model.Competition competition = competitionRepository.findByIdWithParticipants(id)
            .orElseThrow(() -> new RuntimeException("Competition not found"));

        // Calculate statistics
        java.util.List<com.elevenof.backoffice.model.CompetitionParticipant> participants = competition.getParticipants();
        long totalCount = participants.size();
        long registeredCount = participants.stream()
            .filter(p -> p.getStatus() == com.elevenof.backoffice.model.ParticipantStatus.REGISTERED)
            .count();
        long top30Count = participants.stream()
            .filter(p -> p.getStatus() == com.elevenof.backoffice.model.ParticipantStatus.SELECTED_TOP30)
            .count();
        long top11Count = participants.stream()
            .filter(p -> p.getStatus() == com.elevenof.backoffice.model.ParticipantStatus.SELECTED_TOP11)
            .count();

        model.addAttribute("title", "Thí sinh - " + competition.getTitle());
        model.addAttribute("competition", competition);
        model.addAttribute("participants", participants);
        model.addAttribute("totalCount", totalCount);
        model.addAttribute("registeredCount", registeredCount);
        model.addAttribute("top30Count", top30Count);
        model.addAttribute("top11Count", top11Count);
        model.addAttribute("frontendUrl", frontendUrl);

        return "admin/competition-participants";
    }

    /**
     * Competition stages management page
     */
    @GetMapping("/competitions/{id}/stages")
    public String competitionStages(@PathVariable Long id, Model model) {
        com.elevenof.backoffice.model.Competition competition = competitionRepository.findByIdWithStages(id)
            .orElseThrow(() -> new RuntimeException("Competition not found"));

        // Find current live stage number and determine which stages can be activated
        Integer liveStageNumber = null;
        Integer previousStageNumber = null;
        Integer nextUpcomingStageNumber = null;

        for (com.elevenof.backoffice.model.CompetitionStage stage : competition.getStages()) {
            if (stage.getStatus() == com.elevenof.backoffice.model.StageStatus.LIVE) {
                liveStageNumber = stage.getStageNumber();
                previousStageNumber = liveStageNumber > 1 ? liveStageNumber - 1 : null;
                // Find the next upcoming stage after LIVE
                for (com.elevenof.backoffice.model.CompetitionStage nextStage : competition.getStages()) {
                    if (nextStage.getStageNumber() > liveStageNumber &&
                        nextStage.getStatus() == com.elevenof.backoffice.model.StageStatus.UPCOMING) {
                        nextUpcomingStageNumber = nextStage.getStageNumber();
                        break;
                    }
                }
                break;
            }
        }

        // If no LIVE stage, find the first UPCOMING stage
        if (liveStageNumber == null) {
            for (com.elevenof.backoffice.model.CompetitionStage stage : competition.getStages()) {
                if (stage.getStatus() == com.elevenof.backoffice.model.StageStatus.UPCOMING) {
                    nextUpcomingStageNumber = stage.getStageNumber();
                    break;
                }
            }
        }

        // Calculate structure counts for each stage
        java.util.Map<Long, com.elevenof.backoffice.dto.StructureCountDTO> structureCounts = new java.util.HashMap<>();
        for (com.elevenof.backoffice.model.CompetitionStage stage : competition.getStages()) {
            int daysCount = (int) assessmentDayRepository.countByStageId(stage.getId());
            int stepsCount = 0;
            int assessmentsCount = 0;

            java.util.List<com.elevenof.backoffice.model.CompetitionAssessmentDay> days =
                assessmentDayRepository.findByStageIdOrderByDisplayOrderAsc(stage.getId());
            for (com.elevenof.backoffice.model.CompetitionAssessmentDay day : days) {
                stepsCount += assessmentStepRepository.countByAssessmentDayId(day.getId());
                java.util.List<com.elevenof.backoffice.model.CompetitionAssessmentStep> steps =
                    assessmentStepRepository.findByAssessmentDayIdOrderByDisplayOrderAsc(day.getId());
                for (com.elevenof.backoffice.model.CompetitionAssessmentStep step : steps) {
                    assessmentsCount += assessmentRepository.countByAssessmentStepId(step.getId());
                }
            }

            structureCounts.put(stage.getId(), com.elevenof.backoffice.dto.StructureCountDTO.builder()
                .daysCount(daysCount)
                .stepsCount(stepsCount)
                .assessmentsCount(assessmentsCount)
                .build());
        }

        model.addAttribute("title", "Vòng thi - " + competition.getTitle());
        model.addAttribute("competition", competition);
        model.addAttribute("stages", competition.getStages());
        model.addAttribute("liveStageNumber", liveStageNumber);
        model.addAttribute("previousStageNumber", previousStageNumber);
        model.addAttribute("nextUpcomingStageNumber", nextUpcomingStageNumber);
        model.addAttribute("structureCounts", structureCounts);
        model.addAttribute("frontendUrl", frontendUrl);

        return "admin/competition-stages";
    }

    /**
     * Competition edit form page
     */
    @GetMapping("/competitions/{id}/edit")
    public String competitionEdit(@PathVariable Long id, Model model) {
        com.elevenof.backoffice.model.Competition competition = competitionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Competition not found"));

        long participantCount = competitionParticipantRepository.countByCompetitionId(id);
        long stageCount = competitionStageRepository.countByCompetitionId(id);
        long newsCount = competitionNewsRepository.countByCompetitionId(id);
        long sponsorCount = competitionSponsorRepository.countByCompetitionId(id);

        model.addAttribute("title", "Chỉnh sửa cuộc thi - " + competition.getTitle());
        model.addAttribute("competition", competition);
        model.addAttribute("participantCount", participantCount);
        model.addAttribute("stageCount", stageCount);
        model.addAttribute("newsCount", newsCount);
        model.addAttribute("sponsorCount", sponsorCount);

        return "admin/competition-edit";
    }

    /**
     * Competition edit form submission
     */
    @PostMapping("/competitions/{id}/edit")
    public String competitionEditSubmit(
            @PathVariable Long id,
            @RequestParam String title,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String registrationStartDate,
            @RequestParam(required = false) String registrationEndDate,
            @RequestParam(required = false) String competitionStartDate,
            @RequestParam(required = false) String competitionEndDate,
            RedirectAttributes redirectAttributes) {

        com.elevenof.backoffice.model.Competition competition = competitionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Competition not found"));

        competition.setTitle(title);
        competition.setDescription(description);

        // Allow admin to manually set status
        if (status != null && !status.isEmpty()) {
            try {
                competition.setStatus(com.elevenof.backoffice.model.CompetitionStatus.valueOf(status));
            } catch (IllegalArgumentException ignored) {}
        }

        // Parse and update dates based on competition status
        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd");

        // Check current status (before save) to determine if started
        boolean isNotStarted = competition.getStatus() == com.elevenof.backoffice.model.CompetitionStatus.DRAFT ||
                               competition.getStatus() == com.elevenof.backoffice.model.CompetitionStatus.REGISTRATION_OPEN;

        // Only allow editing start dates if not started yet
        if (isNotStarted) {
            if (registrationStartDate != null && !registrationStartDate.isEmpty()) {
                competition.setRegistrationStartDate(java.time.LocalDate.parse(registrationStartDate, formatter));
            }
            if (registrationEndDate != null && !registrationEndDate.isEmpty()) {
                competition.setRegistrationEndDate(java.time.LocalDate.parse(registrationEndDate, formatter));
            }
            if (competitionStartDate != null && !competitionStartDate.isEmpty()) {
                competition.setCompetitionStartDate(java.time.LocalDate.parse(competitionStartDate, formatter));
            }
        }

        // Always allow editing end date
        if (competitionEndDate != null && !competitionEndDate.isEmpty()) {
            competition.setCompetitionEndDate(java.time.LocalDate.parse(competitionEndDate, formatter));
        }

        competitionRepository.save(competition);

        redirectAttributes.addFlashAttribute("success", "Đã cập nhật thông tin cuộc thi thành công!");
        return "redirect:/admin/competitions";
    }

    /**
     * Activate a competition stage
     * - If UPCOMING: Marks previous stage as COMPLETED, current as LIVE
     * - If LIVE: Re-activate (no change, just confirmation)
     * - If COMPLETED (rollback): Marks current as LIVE, next stage as UPCOMING
     * - Updates competition status and currentPhase accordingly
     */
    @PostMapping("/competitions/{competitionId}/stages/{stageNumber}/activate")
    @ResponseBody
    public org.springframework.http.ResponseEntity<String> activateStage(
            @PathVariable Long competitionId,
            @PathVariable Integer stageNumber) {

        try {
            // Find competition
            com.elevenof.backoffice.model.Competition competition = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new RuntimeException("Competition not found"));

            // Find current stage
            com.elevenof.backoffice.model.CompetitionStage currentStage =
                competitionStageRepository.findByCompetitionIdAndStageNumber(competitionId, stageNumber)
                    .orElseThrow(() -> new RuntimeException("Stage not found"));

            com.elevenof.backoffice.model.StageStatus currentStatus = currentStage.getStatus();

            // Handle different scenarios based on current status
            if (currentStatus == com.elevenof.backoffice.model.StageStatus.UPCOMING) {
                // Normal activation: Close previous, open current
                if (stageNumber > 1) {
                    com.elevenof.backoffice.model.CompetitionStage previousStage =
                        competitionStageRepository.findByCompetitionIdAndStageNumber(competitionId, stageNumber - 1)
                            .orElse(null);
                    if (previousStage != null && previousStage.getStatus() == com.elevenof.backoffice.model.StageStatus.LIVE) {
                        previousStage.setStatus(com.elevenof.backoffice.model.StageStatus.COMPLETED);
                        competitionStageRepository.save(previousStage);
                    }
                }

                currentStage.setStatus(com.elevenof.backoffice.model.StageStatus.LIVE);
                competitionStageRepository.save(currentStage);

            } else if (currentStatus == com.elevenof.backoffice.model.StageStatus.COMPLETED) {
                // ROLLBACK: Reopen this stage, close next stage (set to UPCOMING)
                com.elevenof.backoffice.model.CompetitionStage nextStage =
                    competitionStageRepository.findByCompetitionIdAndStageNumber(competitionId, stageNumber + 1)
                        .orElse(null);

                if (nextStage == null || nextStage.getStatus() != com.elevenof.backoffice.model.StageStatus.LIVE) {
                    return org.springframework.http.ResponseEntity
                        .badRequest()
                        .body("Không thể rollback: vòng sau không đang ở trạng thái LIVE");
                }

                // Set next stage back to UPCOMING
                nextStage.setStatus(com.elevenof.backoffice.model.StageStatus.UPCOMING);
                competitionStageRepository.save(nextStage);

                // Reopen current stage
                currentStage.setStatus(com.elevenof.backoffice.model.StageStatus.LIVE);
                competitionStageRepository.save(currentStage);

            } else if (currentStatus == com.elevenof.backoffice.model.StageStatus.LIVE) {
                // Already LIVE - just allow re-activation (no-op)
                // Do nothing, just proceed to update competition status below
            }

            // Update competition status and currentPhase based on stage type
            com.elevenof.backoffice.model.StageType stageType = currentStage.getStageType();
            switch (stageType) {
                case REGIONAL_AUDITION:
                    competition.setStatus(com.elevenof.backoffice.model.CompetitionStatus.REGIONAL_AUDITION);
                    String regionName = currentStage.getRegion() != null ?
                        currentStage.getRegion().name() : "";
                    String regionText = "";
                    if (regionName.equals("HANOI_NORTH")) {
                        regionText = "Hà Nội & Phía Bắc";
                    } else if (regionName.equals("DANANG_CENTRAL")) {
                        regionText = "Đà Nẵng & Miền Trung";
                    } else if (regionName.equals("HCMC_SOUTH")) {
                        regionText = "TP HCM & Miền Nam";
                    }
                    competition.setCurrentPhase("Vòng tuyển trạch - " + regionText);
                    break;
                case TRAINING_EPISODE:
                    competition.setStatus(com.elevenof.backoffice.model.CompetitionStatus.TRAINING_PHASE);
                    competition.setCurrentPhase("Đào tạo - Tập " + (stageNumber - 3)); // Stages 1-3 are regional
                    break;
                case FINAL_MATCH:
                    competition.setStatus(com.elevenof.backoffice.model.CompetitionStatus.FINAL_PHASE);
                    competition.setCurrentPhase("Chung kết");
                    break;
            }

            competitionRepository.save(competition);

            return org.springframework.http.ResponseEntity.ok("Đã kích hoạt vòng " + stageNumber);

        } catch (Exception e) {
            return org.springframework.http.ResponseEntity
                .status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Lỗi: " + e.getMessage());
        }
    }

    @PostMapping("/competitions/{competitionId}/stages/{stageNumber}/deactivate")
    @ResponseBody
    public org.springframework.http.ResponseEntity<String> deactivateStage(
            @PathVariable Long competitionId,
            @PathVariable Integer stageNumber) {
        try {
            com.elevenof.backoffice.model.Competition competition = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new RuntimeException("Competition not found"));

            com.elevenof.backoffice.model.CompetitionStage stage =
                competitionStageRepository.findByCompetitionIdAndStageNumber(competitionId, stageNumber)
                    .orElseThrow(() -> new RuntimeException("Stage not found"));

            if (stage.getStatus() != com.elevenof.backoffice.model.StageStatus.LIVE) {
                return org.springframework.http.ResponseEntity.badRequest().body("Vòng thi không đang ở trạng thái LIVE");
            }

            stage.setStatus(com.elevenof.backoffice.model.StageStatus.UPCOMING);
            competitionStageRepository.save(stage);

            // Update competition status
            if (stageNumber == 1) {
                competition.setStatus(com.elevenof.backoffice.model.CompetitionStatus.REGISTRATION_OPEN);
                competition.setCurrentPhase("REGISTRATION");
            } else {
                // Revert to previous stage's phase
                com.elevenof.backoffice.model.CompetitionStage prevStage =
                    competitionStageRepository.findByCompetitionIdAndStageNumber(competitionId, stageNumber - 1)
                        .orElse(null);
                if (prevStage != null) {
                    com.elevenof.backoffice.model.StageType prevType = prevStage.getStageType();
                    switch (prevType) {
                        case REGIONAL_AUDITION:
                            competition.setStatus(com.elevenof.backoffice.model.CompetitionStatus.REGIONAL_AUDITION);
                            break;
                        case TRAINING_EPISODE:
                            competition.setStatus(com.elevenof.backoffice.model.CompetitionStatus.TRAINING_PHASE);
                            break;
                        case FINAL_MATCH:
                            competition.setStatus(com.elevenof.backoffice.model.CompetitionStatus.FINAL_PHASE);
                            break;
                    }
                }
            }
            competitionRepository.save(competition);

            return org.springframework.http.ResponseEntity.ok("Đã đặt vòng " + stageNumber + " về UPCOMING");
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity
                .status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Lỗi: " + e.getMessage());
        }
    }

    /**
     * Stage edit page
     */
    @GetMapping("/competitions/{competitionId}/stages/{stageNumber}/edit")
    public String stageEdit(
            @PathVariable Long competitionId,
            @PathVariable Integer stageNumber,
            Model model) {

        com.elevenof.backoffice.model.Competition competition = competitionRepository.findById(competitionId)
            .orElseThrow(() -> new RuntimeException("Competition not found"));

        com.elevenof.backoffice.model.CompetitionStage stage =
            competitionStageRepository.findByCompetitionIdAndStageNumber(competitionId, stageNumber)
                .orElseThrow(() -> new RuntimeException("Stage not found"));

        model.addAttribute("title", "Chỉnh sửa vòng thi - " + stage.getTitle());
        model.addAttribute("competition", competition);
        model.addAttribute("stage", stage);

        return "admin/stage-edit";
    }

    /**
     * Stage edit form submission
     */
    @PostMapping("/competitions/{competitionId}/stages/{stageNumber}/edit")
    public String stageEditSubmit(
            @PathVariable Long competitionId,
            @PathVariable Integer stageNumber,
            @RequestParam String title,
            @RequestParam(required = false) String description,
            @RequestParam String stageDate,
            @RequestParam(required = false) String stageTime,
            @RequestParam boolean isPublicScoring,
            RedirectAttributes redirectAttributes) {

        com.elevenof.backoffice.model.CompetitionStage stage =
            competitionStageRepository.findByCompetitionIdAndStageNumber(competitionId, stageNumber)
                .orElseThrow(() -> new RuntimeException("Stage not found"));

        stage.setTitle(title);
        stage.setDescription(description);
        stage.setStageDate(java.time.LocalDate.parse(stageDate));
        stage.setStageTime(stageTime);
        stage.setIsPublicScoring(isPublicScoring);

        competitionStageRepository.save(stage);

        redirectAttributes.addFlashAttribute("success", "Đã cập nhật thông tin vòng thi thành công!");
        return "redirect:/admin/competitions/" + competitionId + "/stages";
    }

    /**
     * Assessment structure management page
     */
    @GetMapping("/competitions/{competitionId}/stages/{stageNumber}/assessment-structure")
    public String stageAssessmentStructure(
            @PathVariable Long competitionId,
            @PathVariable Integer stageNumber,
            Model model) {

        com.elevenof.backoffice.model.Competition competition = competitionRepository.findById(competitionId)
            .orElseThrow(() -> new RuntimeException("Competition not found"));

        com.elevenof.backoffice.model.CompetitionStage stage =
            competitionStageRepository.findByCompetitionIdAndStageNumber(competitionId, stageNumber)
                .orElseThrow(() -> new RuntimeException("Stage not found"));

        model.addAttribute("title", "Cấu trúc đánh giá - " + stage.getTitle());
        model.addAttribute("competition", competition);
        model.addAttribute("stage", stage);

        return "admin/stage-assessment-structure";
    }

    /**
     * Stage results entry page
     */
    @GetMapping("/competitions/{competitionId}/stages/{stageNumber}/results")
    public String stageResults(
            @PathVariable Long competitionId,
            @PathVariable Integer stageNumber,
            Model model) {

        com.elevenof.backoffice.model.Competition competition = competitionRepository.findById(competitionId)
            .orElseThrow(() -> new RuntimeException("Competition not found"));

        com.elevenof.backoffice.model.CompetitionStage stage =
            competitionStageRepository.findByCompetitionIdAndStageNumber(competitionId, stageNumber)
                .orElseThrow(() -> new RuntimeException("Stage not found"));

        model.addAttribute("title", "Kết quả - " + stage.getTitle());
        model.addAttribute("competition", competition);
        model.addAttribute("stage", stage);
        // Don't pass participants through Thymeleaf - load via API instead

        return "admin/stage-results";
    }

    /**
     * Players management page
     */
    @GetMapping("/players")
    public String players(
            Model model,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String position,
            @RequestParam(required = false) Long provinceId,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) Boolean verified,
            @RequestParam(required = false) Boolean hasPendingItems
    ) {
        // Sort by active users first (user.enabled DESC), then by creation time (createdAt DESC)
        Pageable pageable = PageRequest.of(page, size, Sort.by(
            Sort.Order.desc("user.enabled"),
            Sort.Order.desc("createdAt")
        ));

        // Convert level string to enum - must be final for lambda
        Player.PlayerLevel tempLevel = null;
        if (level != null && !level.isEmpty()) {
            try {
                tempLevel = Player.PlayerLevel.valueOf(level);
            } catch (IllegalArgumentException e) {
                // Invalid level, ignore
            }
        }
        final Player.PlayerLevel playerLevel = tempLevel;

        // Apply filters
        Page<Player> playerPage;
        if ((search != null && !search.trim().isEmpty()) ||
            (position != null && !position.trim().isEmpty()) ||
            provinceId != null ||
            playerLevel != null ||
            verified != null ||
            (hasPendingItems != null && hasPendingItems)) {

            // Use specification for filtering
            org.springframework.data.jpa.domain.Specification<Player> spec =
                    (root, query, cb) -> {
                        List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();

                        // Join with User
                        jakarta.persistence.criteria.Join<Player, User> userJoin = root.join("user");

                        // Search by name
                        if (search != null && !search.trim().isEmpty()) {
                            predicates.add(cb.like(
                                cb.lower(userJoin.get("fullName")),
                                "%" + search.toLowerCase() + "%"
                            ));
                        }

                        // Filter by position
                        if (position != null && !position.isEmpty()) {
                            predicates.add(cb.like(
                                root.get("positions"),
                                "%" + position + "%"
                            ));
                        }

                        // Filter by province
                        if (provinceId != null) {
                            jakarta.persistence.criteria.Join<User, Address> addressJoin =
                                userJoin.join("address", jakarta.persistence.criteria.JoinType.LEFT);
                            predicates.add(cb.equal(
                                addressJoin.get("province").get("id"),
                                provinceId
                            ));
                        }

                        // Filter by level
                        if (playerLevel != null) {
                            predicates.add(cb.equal(root.get("level"), playerLevel));
                        }

                        // Filter by verification status
                        if (verified != null) {
                            predicates.add(cb.equal(root.get("verified"), verified));
                        }

                        // Filter by pending achievements/highlights
                        // Use EXISTS subquery to avoid duplicate rows (no need for DISTINCT which causes MySQL ORDER BY issues)
                        if (hasPendingItems != null && hasPendingItems) {
                            // Subquery for pending achievements
                            jakarta.persistence.criteria.Subquery<Long> achievementSubquery = query.subquery(Long.class);
                            jakarta.persistence.criteria.Root<com.elevenof.backoffice.model.PlayerAchievement> achievementRoot =
                                achievementSubquery.from(com.elevenof.backoffice.model.PlayerAchievement.class);
                            achievementSubquery.select(achievementRoot.get("player").get("id"));
                            achievementSubquery.where(
                                cb.and(
                                    cb.equal(achievementRoot.get("player").get("id"), root.get("id")),
                                    cb.equal(achievementRoot.get("approvalStatus"),
                                        com.elevenof.backoffice.model.PlayerAchievement.ApprovalStatus.PENDING)
                                )
                            );

                            // Subquery for pending highlights
                            jakarta.persistence.criteria.Subquery<Long> highlightSubquery = query.subquery(Long.class);
                            jakarta.persistence.criteria.Root<com.elevenof.backoffice.model.PlayerHighlight> highlightRoot =
                                highlightSubquery.from(com.elevenof.backoffice.model.PlayerHighlight.class);
                            highlightSubquery.select(highlightRoot.get("player").get("id"));
                            highlightSubquery.where(
                                cb.and(
                                    cb.equal(highlightRoot.get("player").get("id"), root.get("id")),
                                    cb.equal(highlightRoot.get("approvalStatus"),
                                        com.elevenof.backoffice.model.PlayerHighlight.ApprovalStatus.PENDING)
                                )
                            );

                            // Player must have either pending achievements OR pending highlights
                            predicates.add(cb.or(
                                cb.exists(achievementSubquery),
                                cb.exists(highlightSubquery)
                            ));
                        }

                        return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
                    };

                playerPage = playerRepository.findAll(spec, pageable);
            } else {
                playerPage = playerRepository.findAll(pageable);
            }

            // Load all provinces for filter dropdown
            List<Province> provinces = provinceRepository.findAll();

            // Load attributes for all players in current page
            Map<Long, Map<String, Integer>> playerAttributesMap = new java.util.HashMap<>();
            Map<Long, String> playerAttributeTypeMap = new java.util.HashMap<>(); // "synthetic", "real", or "none"
            Map<Long, List<com.elevenof.backoffice.model.PlayerAttributeType>> playerHexagonTypesMap = new java.util.HashMap<>();
            Map<Long, Boolean> playerHasPendingItemsMap = new java.util.HashMap<>(); // Track pending achievements/highlights

            // Load synthetic and real hexagon types once
            List<com.elevenof.backoffice.model.PlayerAttributeType> syntheticTypes = new ArrayList<>();
            List<String> syntheticKeys = List.of("FIT", "EXP", "SKL", "PRF", "ACH", "HLT");
            for (String key : syntheticKeys) {
                try {
                    syntheticTypes.add(playerAttributeTypeService.getAttributeTypeByKey(key));
                } catch (IllegalArgumentException e) {
                    // Synthetic type not found, continue
                }
            }
            List<com.elevenof.backoffice.model.PlayerAttributeType> realHexagonTypes =
                    playerAttributeTypeService.getHexagonAttributeTypes();

            for (Player player : playerPage.getContent()) {
                Long userId = player.getUser().getId();

                // Determine attribute type first
                boolean hasSynthetic = playerAttributeService.hasSyntheticAttributes(userId);
                boolean hasReal = playerAttributeService.hasRealAttributes(userId);

                // Assign appropriate attribute types based on what player has
                if (hasSynthetic) {
                    playerAttributeTypeMap.put(player.getId(), "synthetic");
                    playerHexagonTypesMap.put(player.getId(), syntheticTypes);
                } else if (hasReal) {
                    playerAttributeTypeMap.put(player.getId(), "real");
                    playerHexagonTypesMap.put(player.getId(), realHexagonTypes);
                } else {
                    playerAttributeTypeMap.put(player.getId(), "none");
                    playerHexagonTypesMap.put(player.getId(), realHexagonTypes); // default to real
                }

                // Use getHexagonAttributesWithValues which prioritizes synthetic over real
                List<com.elevenof.backoffice.dto.response.PlayerAttributeDTO> hexagonAttrs =
                        playerAttributeService.getHexagonAttributesWithValues(userId);

                // Convert DTO list to Map<String, Integer>
                Map<String, Integer> attrs = hexagonAttrs.stream()
                        .filter(dto -> dto.getAttributeValue() != null)
                        .collect(java.util.stream.Collectors.toMap(
                                com.elevenof.backoffice.dto.response.PlayerAttributeDTO::getAttributeKey,
                                com.elevenof.backoffice.dto.response.PlayerAttributeDTO::getAttributeValue
                        ));
                playerAttributesMap.put(player.getId(), attrs);

                // Check if player has pending achievements or highlights (with null safety)
                boolean hasPendingAchievements = player.getAchievements() != null &&
                        player.getAchievements().stream()
                                .anyMatch(achievement -> achievement.getApprovalStatus() == PlayerAchievement.ApprovalStatus.PENDING);
                boolean hasPendingHighlights = player.getHighlights() != null &&
                        player.getHighlights().stream()
                                .anyMatch(highlight -> highlight.getApprovalStatus() == PlayerHighlight.ApprovalStatus.PENDING);
                playerHasPendingItemsMap.put(player.getId(), hasPendingAchievements || hasPendingHighlights);
            }

            model.addAttribute("title", "Cầu thủ");
            model.addAttribute("players", playerPage.getContent());
            model.addAttribute("currentPage", page);
            model.addAttribute("totalPages", playerPage.getTotalPages());
            model.addAttribute("totalItems", playerPage.getTotalElements());
            model.addAttribute("pageSize", size);
            model.addAttribute("frontendUrl", frontendUrl);
            model.addAttribute("provinces", provinces);
            model.addAttribute("playerHexagonTypesMap", playerHexagonTypesMap);
            model.addAttribute("playerAttributesMap", playerAttributesMap);
            model.addAttribute("playerAttributeTypeMap", playerAttributeTypeMap);
            model.addAttribute("playerHasPendingItemsMap", playerHasPendingItemsMap);

            // Preserve filter params
            model.addAttribute("search", search != null ? search : "");
            model.addAttribute("position", position != null ? position : "");
            model.addAttribute("provinceId", provinceId);
            model.addAttribute("level", level != null ? level : "");
            model.addAttribute("verified", verified);
            model.addAttribute("hasPendingItems", hasPendingItems);

            return "admin/players";
    }

    /**
     * Matches management page
     */
    @GetMapping("/matches")
    public String matches(Model model) {
        model.addAttribute("title", "Trận đấu");
        return "admin/matches";
    }

    /**
     * Users and ACL management page
     */
    @GetMapping("/users")
    public String users(
            Model model,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "false") boolean showAllUsers
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<User> userPage;

        if (showAllUsers) {
            // Show all users including USER role
            userPage = userRepository.findAll(pageable);
        } else {
            // Show only EDITOR, ADMIN, SUPER_USER
            List<User.Role> adminRoles = Arrays.asList(
                    User.Role.EDITOR,
                    User.Role.ADMIN,
                    User.Role.SUPER_USER
            );
            userPage = userRepository.findByRoleIn(adminRoles, pageable);
        }

        model.addAttribute("title", "Tài khoản và phân quyền");
        model.addAttribute("users", userPage.getContent());
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", userPage.getTotalPages());
        model.addAttribute("totalItems", userPage.getTotalElements());
        model.addAttribute("pageSize", size);
        model.addAttribute("showAllUsers", showAllUsers);

        return "admin/users";
    }

    @GetMapping("/users/new")
    public String userNew(Model model) {
        model.addAttribute("title", "Tạo tài khoản mới");
        model.addAttribute("editUser", null);
        model.addAttribute("allRoles", User.Role.values());
        return "admin/user-edit";
    }

    @PostMapping("/users/new")
    public String userCreate(
            @RequestParam String phone,
            @RequestParam(required = false) String fullName,
            @RequestParam(required = false) String email,
            @RequestParam String role,
            @RequestParam String password,
            RedirectAttributes redirectAttributes) {
        try {
            if (userRepository.existsByPhone(phone)) {
                redirectAttributes.addFlashAttribute("error", "Số điện thoại đã tồn tại");
                return "redirect:/admin/users/new";
            }
            String userid = "u" + System.currentTimeMillis() + (int)(Math.random() * 1000);
            if (userid.length() > 16) userid = userid.substring(0, 16);
            User newUser = User.builder()
                .phone(phone).userid(userid).fullName(fullName).email(email)
                .password(password).role(User.Role.valueOf(role))
                .enabled(true).accountNonExpired(true).accountNonLocked(true).credentialsNonExpired(true)
                .build();
            authenticationService.createUser(newUser);
            redirectAttributes.addFlashAttribute("success", "Đã tạo tài khoản thành công!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Lỗi: " + e.getMessage());
        }
        return "redirect:/admin/users";
    }

    @GetMapping("/users/{id}/edit")
    public String userEdit(@PathVariable Long id, Model model) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        model.addAttribute("title", "Chỉnh sửa tài khoản");
        model.addAttribute("editUser", user);
        model.addAttribute("allRoles", User.Role.values());
        return "admin/user-edit";
    }

    @PostMapping("/users/{id}/edit")
    public String userUpdate(
            @PathVariable Long id,
            @RequestParam(required = false) String fullName,
            @RequestParam(required = false) String email,
            @RequestParam String role,
            @RequestParam(defaultValue = "false") boolean enabled,
            RedirectAttributes redirectAttributes) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setFullName(fullName);
        user.setEmail(email);
        user.setRole(User.Role.valueOf(role));
        user.setEnabled(enabled);
        userRepository.save(user);
        redirectAttributes.addFlashAttribute("success", "Đã cập nhật tài khoản!");
        return "redirect:/admin/users";
    }

    @PostMapping("/users/{id}/lock")
    public String userLock(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setAccountNonLocked(false);
        userRepository.save(user);
        redirectAttributes.addFlashAttribute("success", "Đã khóa tài khoản!");
        return "redirect:/admin/users";
    }

    @PostMapping("/users/{id}/unlock")
    public String userUnlock(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setAccountNonLocked(true);
        user.setEnabled(true);
        userRepository.save(user);
        redirectAttributes.addFlashAttribute("success", "Đã mở khóa tài khoản!");
        return "redirect:/admin/users";
    }

    @PostMapping("/users/{id}/reset-password")
    public String userResetPassword(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setPassword("123456");
        // encode manually
        user.setPassword(passwordEncoder.encode("123456"));
        redirectAttributes.addFlashAttribute("success", "Đã reset mật khẩu về: 123456");
        return "redirect:/admin/users";
    }
    @GetMapping("/players/edit/{id}")
    public String editPlayer(
            @PathVariable Long id,
            @RequestParam(required = false) String returnUrl,
            Model model
    ) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        List<Province> provinces = provinceRepository.findAll();

        // If player.address is null, populate it from user.address.address
        if (player.getAddress() == null && player.getUser().getAddress() != null) {
            player.setAddress(player.getUser().getAddress().getAddress());
        }

        // Add synthetic attributes status
        Long userId = player.getUser().getId();
        model.addAttribute("hasSyntheticAttributes", playerAttributeService.hasSyntheticAttributes(userId));
        model.addAttribute("hasRealAttributes", playerAttributeService.hasRealAttributes(userId));
        model.addAttribute("generationTimestamp", playerAttributeService.getGenerationTimestamp(userId));

        model.addAttribute("title", "Chỉnh sửa cầu thủ");
        model.addAttribute("player", player);
        model.addAttribute("user", player.getUser());
        model.addAttribute("provinces", provinces);
        model.addAttribute("returnUrl", returnUrl);

        return "admin/player-edit";
    }

    /**
     * Save player updates
     */
    @PostMapping("/players/edit/{id}")
    @org.springframework.transaction.annotation.Transactional
    public String updatePlayer(
            @PathVariable Long id,
            @RequestParam(required = false) String returnUrl,
            HttpServletRequest request,
            RedirectAttributes redirectAttributes
    ) {
        try {
            // Extract form parameters
            String fullName = request.getParameter("fullName");
            String phone = request.getParameter("phone");
            String email = request.getParameter("email");
            String avatar = request.getParameter("avatar");
            String dob = request.getParameter("dob");
            String gender = request.getParameter("gender");
            String provinceIdStr = request.getParameter("provinceId");
            String heightStr = request.getParameter("height");
            String weightStr = request.getParameter("weight");
            String preferredFoot = request.getParameter("preferredFoot");
            String secondaryPosition = request.getParameter("secondaryPosition");
            String yearsOfExperienceStr = request.getParameter("yearsOfExperience");
            String[] positions = request.getParameterValues("positions");
            String level = request.getParameter("level");
            String bio = request.getParameter("bio");
            String personalId = request.getParameter("personalId");
            String address = request.getParameter("address");
            String school = request.getParameter("school");
            String academy = request.getParameter("academy");
            String club = request.getParameter("club");
            String verifiedStr = request.getParameter("verified");

            // Parse collections from request parameters
            Map<String, String> individualAchievementsTitles = new java.util.HashMap<>();
            Map<String, String> individualAchievementsDates = new java.util.HashMap<>();
            Map<String, String> teamAchievementsTitles = new java.util.HashMap<>();
            Map<String, String> teamAchievementsDates = new java.util.HashMap<>();
            Map<String, String> participantAchievementsTitles = new java.util.HashMap<>();
            Map<String, String> participantAchievementsDates = new java.util.HashMap<>();
            Map<String, String> highlightsUrls = new java.util.HashMap<>();
            Map<String, String> highlightsDates = new java.util.HashMap<>();
            Map<String, String> socials = new java.util.HashMap<>();

            request.getParameterMap().forEach((key, values) -> {
                if (key.startsWith("individualAchievements[") && key.endsWith(".title") && values.length > 0) {
                    individualAchievementsTitles.put(key.replace(".title", ""), values[0]);
                } else if (key.startsWith("individualAchievements[") && key.endsWith(".date") && values.length > 0) {
                    individualAchievementsDates.put(key.replace(".date", ""), values[0]);
                } else if (key.startsWith("teamAchievements[") && key.endsWith(".title") && values.length > 0) {
                    teamAchievementsTitles.put(key.replace(".title", ""), values[0]);
                } else if (key.startsWith("teamAchievements[") && key.endsWith(".date") && values.length > 0) {
                    teamAchievementsDates.put(key.replace(".date", ""), values[0]);
                } else if (key.startsWith("participantAchievements[") && key.endsWith(".title") && values.length > 0) {
                    participantAchievementsTitles.put(key.replace(".title", ""), values[0]);
                } else if (key.startsWith("participantAchievements[") && key.endsWith(".date") && values.length > 0) {
                    participantAchievementsDates.put(key.replace(".date", ""), values[0]);
                } else if (key.startsWith("highlights[") && key.endsWith(".url") && values.length > 0) {
                    highlightsUrls.put(key.replace(".url", ""), values[0]);
                } else if (key.startsWith("highlights[") && key.endsWith(".date") && values.length > 0) {
                    highlightsDates.put(key.replace(".date", ""), values[0]);
                } else if (key.startsWith("socials[") && key.endsWith(".url") && values.length > 0) {
                    socials.put(key, values[0]);
                }
            });

            System.out.println("=== PARSED COLLECTIONS ===");
            System.out.println("individualAchievementsTitles: " + individualAchievementsTitles);
            System.out.println("individualAchievementsDates: " + individualAchievementsDates);
            System.out.println("teamAchievementsTitles: " + teamAchievementsTitles);
            System.out.println("teamAchievementsDates: " + teamAchievementsDates);
            System.out.println("highlightsUrls: " + highlightsUrls);
            System.out.println("highlightsDates: " + highlightsDates);
            System.out.println("socials: " + socials);

            Long provinceId = (provinceIdStr != null && !provinceIdStr.isEmpty()) ? Long.parseLong(provinceIdStr) : null;
            Integer height = (heightStr != null && !heightStr.isEmpty()) ? Integer.parseInt(heightStr) : null;
            Integer weight = (weightStr != null && !weightStr.isEmpty()) ? Integer.parseInt(weightStr) : null;
            Integer yearsOfExperience = (yearsOfExperienceStr != null && !yearsOfExperienceStr.isEmpty()) ? Integer.parseInt(yearsOfExperienceStr) : null;
            // Fetch existing player and user
            Player existingPlayer = playerRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Player not found"));
            User existingUser = existingPlayer.getUser();

            // Update user fields
            existingUser.setFullName(fullName);
            existingUser.setPhone(phone);
            existingUser.setEmail(email);
            existingUser.setAvatar(avatar);
            if (dob != null && !dob.isEmpty()) {
                existingUser.setDob(LocalDate.parse(dob));
            }
            if (gender != null && !gender.isEmpty()) {
                existingUser.setGender(User.Gender.valueOf(gender));
            }

            // Update or create address (province only)
            if (provinceId != null) {
                Province province = provinceRepository.findById(provinceId)
                        .orElseThrow(() -> new RuntimeException("Province not found"));

                Address userAddress = addressRepository.findByUserId(existingUser.getId())
                        .orElse(Address.builder()
                                .user(existingUser)
                                .build());

                userAddress.setProvince(province);
                addressRepository.save(userAddress);
            }

            // Update player basic fields
            existingPlayer.setHeight(height);
            existingPlayer.setWeight(weight);
            existingPlayer.setPreferredFoot(preferredFoot);
            existingPlayer.setSecondaryPosition(secondaryPosition);
            existingPlayer.setYearsOfExperience(yearsOfExperience);

            // Convert List<String> positions to comma-separated string
            if (positions != null && positions.length > 0) {
                existingPlayer.setPositions(String.join(",", positions));
            } else {
                existingPlayer.setPositions(null);
            }

            if (level != null && !level.isEmpty()) {
                existingPlayer.setLevel(Player.PlayerLevel.valueOf(level));
            }
            existingPlayer.setBio(bio);

            // Update new extended fields
            existingPlayer.setPersonalId(personalId);
            existingPlayer.setAddress(address);
            existingPlayer.setSchool(school);
            existingPlayer.setAcademy(academy);
            existingPlayer.setClub(club);

            // Update verified status and send notification if changed
            boolean wasVerified = existingPlayer.getVerified();
            boolean isNowVerified = verifiedStr != null && verifiedStr.equals("on");
            existingPlayer.setVerified(isNowVerified);

            // Send notification if player just got verified
            if (!wasVerified && isNowVerified) {
                try {
                    java.util.Map<String, String> variables = new java.util.HashMap<>();
                    variables.put("fullName", existingUser.getFullName());
                    eventPublisher.publishEvent(new com.elevenof.backoffice.event.NotificationEvent(
                        this, existingUser.getId(), "ACCOUNT_VERIFIED", variables, null
                    ));
                } catch (Exception e) {
                    // Log but don't fail the update
                    System.err.println("Failed to send verification notification: " + e.getMessage());
                }
            }

            // Update achievements - preserve approval status from existing achievements
            // First, build a map of existing achievements by (type + title) to preserve their approval status
            java.util.Map<String, com.elevenof.backoffice.model.PlayerAchievement.ApprovalStatus> existingApprovalMap =
                new java.util.HashMap<>();
            if (existingPlayer.getAchievements() != null) {
                for (com.elevenof.backoffice.model.PlayerAchievement existingAch : existingPlayer.getAchievements()) {
                    String key = existingAch.getType() + ":" + existingAch.getTitle().trim().toLowerCase();
                    existingApprovalMap.put(key, existingAch.getApprovalStatus());
                }
            }

            // Now delete all and recreate
            playerAchievementRepository.deleteByPlayerId(id);

            if (individualAchievementsTitles != null) {
                individualAchievementsTitles.forEach((baseKey, title) -> {
                    if (title != null && !title.trim().isEmpty()) {
                        String dateStr = individualAchievementsDates.get(baseKey);
                        LocalDate achievementDate = null;
                        if (dateStr != null && !dateStr.trim().isEmpty()) {
                            try {
                                achievementDate = LocalDate.parse(dateStr);
                            } catch (Exception e) {
                                achievementDate = null;
                            }
                        }

                        // Check if this achievement existed before and preserve its approval status
                        String key = "INDIVIDUAL:" + title.trim().toLowerCase();
                        com.elevenof.backoffice.model.PlayerAchievement.ApprovalStatus approvalStatus =
                            existingApprovalMap.getOrDefault(key, com.elevenof.backoffice.model.PlayerAchievement.ApprovalStatus.PENDING);

                        com.elevenof.backoffice.model.PlayerAchievement achievement =
                                com.elevenof.backoffice.model.PlayerAchievement.builder()
                                        .player(existingPlayer)
                                        .type(com.elevenof.backoffice.model.PlayerAchievement.AchievementType.INDIVIDUAL)
                                        .title(title.trim())
                                        .achievementDate(achievementDate)
                                        .approvalStatus(approvalStatus)
                                        .build();
                        playerAchievementRepository.save(achievement);
                    }
                });
            }
            if (teamAchievementsTitles != null) {
                teamAchievementsTitles.forEach((baseKey, title) -> {
                    if (title != null && !title.trim().isEmpty()) {
                        String dateStr = teamAchievementsDates.get(baseKey);
                        LocalDate achievementDate = null;
                        if (dateStr != null && !dateStr.trim().isEmpty()) {
                            try {
                                achievementDate = LocalDate.parse(dateStr);
                            } catch (Exception e) {
                                achievementDate = null;
                            }
                        }

                        // Check if this achievement existed before and preserve its approval status
                        String key = "TEAM:" + title.trim().toLowerCase();
                        com.elevenof.backoffice.model.PlayerAchievement.ApprovalStatus approvalStatus =
                            existingApprovalMap.getOrDefault(key, com.elevenof.backoffice.model.PlayerAchievement.ApprovalStatus.PENDING);

                        com.elevenof.backoffice.model.PlayerAchievement achievement =
                                com.elevenof.backoffice.model.PlayerAchievement.builder()
                                        .player(existingPlayer)
                                        .type(com.elevenof.backoffice.model.PlayerAchievement.AchievementType.TEAM)
                                        .title(title.trim())
                                        .achievementDate(achievementDate)
                                        .approvalStatus(approvalStatus)
                                        .build();
                        playerAchievementRepository.save(achievement);
                    }
                });
            }
            if (participantAchievementsTitles != null) {
                participantAchievementsTitles.forEach((baseKey, title) -> {
                    if (title != null && !title.trim().isEmpty()) {
                        String dateStr = participantAchievementsDates.get(baseKey);
                        LocalDate achievementDate = null;
                        if (dateStr != null && !dateStr.trim().isEmpty()) {
                            try {
                                achievementDate = LocalDate.parse(dateStr);
                            } catch (Exception e) {
                                achievementDate = null;
                            }
                        }

                        // Check if this achievement existed before and preserve its approval status
                        String key = "PARTICIPANT:" + title.trim().toLowerCase();
                        com.elevenof.backoffice.model.PlayerAchievement.ApprovalStatus approvalStatus =
                            existingApprovalMap.getOrDefault(key, com.elevenof.backoffice.model.PlayerAchievement.ApprovalStatus.PENDING);

                        com.elevenof.backoffice.model.PlayerAchievement achievement =
                                com.elevenof.backoffice.model.PlayerAchievement.builder()
                                        .player(existingPlayer)
                                        .type(com.elevenof.backoffice.model.PlayerAchievement.AchievementType.PARTICIPANT)
                                        .title(title.trim())
                                        .achievementDate(achievementDate)
                                        .approvalStatus(approvalStatus)
                                        .build();
                        playerAchievementRepository.save(achievement);
                    }
                });
            }

            // Update highlights - preserve approval status from existing highlights
            // First, build a map of existing highlights by URL to preserve their approval status
            java.util.Map<String, com.elevenof.backoffice.model.PlayerHighlight.ApprovalStatus> existingHighlightApprovalMap =
                new java.util.HashMap<>();
            if (existingPlayer.getHighlights() != null) {
                for (com.elevenof.backoffice.model.PlayerHighlight existingHl : existingPlayer.getHighlights()) {
                    String urlKey = existingHl.getUrl().trim().toLowerCase();
                    existingHighlightApprovalMap.put(urlKey, existingHl.getApprovalStatus());
                }
            }

            // Now delete all and recreate
            playerHighlightRepository.deleteByPlayerId(id);

            if (highlightsUrls != null) {
                highlightsUrls.forEach((baseKey, url) -> {
                    if (url != null && !url.trim().isEmpty()) {
                        String dateStr = highlightsDates.get(baseKey);
                        LocalDate highlightDate = null;
                        if (dateStr != null && !dateStr.trim().isEmpty()) {
                            try {
                                highlightDate = LocalDate.parse(dateStr);
                            } catch (Exception e) {
                                highlightDate = null;
                            }
                        }

                        // Check if this highlight existed before and preserve its approval status
                        String urlKey = url.trim().toLowerCase();
                        com.elevenof.backoffice.model.PlayerHighlight.ApprovalStatus approvalStatus =
                            existingHighlightApprovalMap.getOrDefault(urlKey, com.elevenof.backoffice.model.PlayerHighlight.ApprovalStatus.PENDING);

                        com.elevenof.backoffice.model.PlayerHighlight highlight =
                                com.elevenof.backoffice.model.PlayerHighlight.builder()
                                        .player(existingPlayer)
                                        .url(url.trim())
                                        .platform(com.elevenof.backoffice.util.PlatformDetector.detectPlatform(url))
                                        .highlightDate(highlightDate)
                                        .approvalStatus(approvalStatus)
                                        .build();
                        playerHighlightRepository.save(highlight);
                    }
                });
            }

            // Update socials - delete from DB first, then recreate
            playerSocialRepository.deleteByPlayerId(id);

            if (socials != null) {
                socials.forEach((key, url) -> {
                    if (url != null && !url.trim().isEmpty()) {
                        com.elevenof.backoffice.model.PlayerSocial social =
                                com.elevenof.backoffice.model.PlayerSocial.builder()
                                        .player(existingPlayer)
                                        .url(url.trim())
                                        .platform(com.elevenof.backoffice.util.PlatformDetector.detectPlatform(url))
                                        .build();
                        playerSocialRepository.save(social);
                    }
                });
            }

            // Save
            userRepository.save(existingUser);
            playerRepository.save(existingPlayer);

            redirectAttributes.addFlashAttribute("successMessage", "Cập nhật thông tin cầu thủ thành công!");
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("ERROR updating player: " + e.getMessage());
            redirectAttributes.addFlashAttribute("errorMessage", "Lỗi khi cập nhật: " + e.getMessage());
        }

        // Return to list with preserved state
        if (returnUrl != null && !returnUrl.isEmpty()) {
            return "redirect:" + returnUrl;
        }
        return "redirect:/admin/players";
    }

    /**
     * Soft delete player (set enabled = false)
     */
    @PostMapping("/players/delete/{id}")
    public String deletePlayer(
            @PathVariable Long id,
            @RequestParam(required = false) String returnUrl,
            RedirectAttributes redirectAttributes
    ) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        User user = player.getUser();
        user.setEnabled(false);
        userRepository.save(user);

        redirectAttributes.addFlashAttribute("successMessage", "Vô hiệu hóa cầu thủ thành công!");

        // Return to list with preserved state
        if (returnUrl != null && !returnUrl.isEmpty()) {
            return "redirect:" + returnUrl;
        }
        return "redirect:/admin/players";
    }

    /**
     * Activate player (set enabled = true)
     */
    @PostMapping("/players/activate/{id}")
    public String activatePlayer(
            @PathVariable Long id,
            @RequestParam(required = false) String returnUrl,
            RedirectAttributes redirectAttributes
    ) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        User user = player.getUser();
        user.setEnabled(true);
        userRepository.save(user);

        redirectAttributes.addFlashAttribute("successMessage", "Kích hoạt cầu thủ thành công!");

        // Return to list with preserved state
        if (returnUrl != null && !returnUrl.isEmpty()) {
            return "redirect:" + returnUrl;
        }
        return "redirect:/admin/players";
    }

    /**
     * Toggle player verified status (AJAX endpoint)
     */
    @PostMapping("/players/{id}/toggle-verified")
    @ResponseBody
    public java.util.Map<String, Object> togglePlayerVerified(
            @PathVariable Long id,
            @RequestParam boolean verified
    ) {
        try {
            Player player = playerRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Player not found"));

            boolean wasVerified = player.getVerified();
            player.setVerified(verified);
            playerRepository.save(player);

            // Send notification if player just got verified
            if (!wasVerified && verified) {
                try {
                    User user = player.getUser();
                    java.util.Map<String, String> variables = new java.util.HashMap<>();
                    variables.put("fullName", user.getFullName());
                    eventPublisher.publishEvent(new com.elevenof.backoffice.event.NotificationEvent(
                        this, user.getId(), "ACCOUNT_VERIFIED", variables, null
                    ));
                } catch (Exception e) {
                    System.err.println("Failed to send verification notification: " + e.getMessage());
                }
            }

            return java.util.Map.of(
                "success", true,
                "verified", verified,
                "message", verified ? "Đã xác minh" : "Chưa xác minh"
            );
        } catch (Exception e) {
            e.printStackTrace();
            return java.util.Map.of(
                "success", false,
                "message", "Lỗi: " + e.getMessage()
            );
        }
    }

    // ==================== EVENTS MANAGEMENT ====================

    @GetMapping("/events")
    public String events(
            Model model,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long provinceId
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "startDate"));

        Event.EventStatus tempStatus = null;
        if (status != null && !status.isEmpty()) {
            try {
                tempStatus = Event.EventStatus.valueOf(status);
            } catch (IllegalArgumentException e) {
                // Invalid status, ignore
            }
        }
        final Event.EventStatus eventStatus = tempStatus;

        Specification<Event> spec = EventSpecification.withFilters(search, eventStatus, provinceId);
        Page<Event> eventPage = eventRepository.findAll(spec, pageable);

        // Calculate participant counts for each event
        List<Event> eventsWithCounts = eventPage.getContent();
        eventsWithCounts.forEach(event -> {
            long count = eventService.getParticipantCount(event.getId());
            // Store count temporarily (will be accessed in template via service call)
        });

        model.addAttribute("title", "Sự kiện");
        model.addAttribute("events", eventPage.getContent());
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", eventPage.getTotalPages());
        model.addAttribute("totalItems", eventPage.getTotalElements());
        model.addAttribute("pageSize", size);
        model.addAttribute("provinces", provinceRepository.findAll());
        model.addAttribute("search", search != null ? search : "");
        model.addAttribute("status", status != null ? status : "");
        model.addAttribute("provinceId", provinceId);
        model.addAttribute("eventService", eventService);

        return "admin/events";
    }

    @GetMapping("/events/new")
    public String newEvent(Model model) {
        model.addAttribute("title", "Tạo sự kiện mới");
        model.addAttribute("event", null);
        model.addAttribute("provinces", provinceRepository.findAll());
        model.addAttribute("isNew", true);

        return "admin/event-edit";
    }

    @PostMapping("/events/new")
    public String createEvent(
            @RequestParam String title,
            @RequestParam(required = false) String picture,
            @RequestParam(required = false) MultipartFile pictureFile,
            @RequestParam(required = false) String shortContent,
            @RequestParam(required = false) String content,
            @RequestParam String startDate,
            @RequestParam(required = false) String startTime,
            @RequestParam String endDate,
            @RequestParam(required = false) String endTime,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Long provinceId,
            @RequestParam String status,
            RedirectAttributes redirectAttributes
    ) {
        try {
            // Handle image upload if file is provided
            String imageUrl = picture;
            if (pictureFile != null && !pictureFile.isEmpty()) {
                imageUrl = s3Service.uploadEventImage(pictureFile, 0L); // Use 0 for new events
            }

            Event event = Event.builder()
                .title(title)
                .picture(imageUrl)
                .shortContent(shortContent)
                .content(content)
                .startDate(LocalDate.parse(startDate))
                .startTime(startTime != null && !startTime.isEmpty() ? LocalTime.parse(startTime) : null)
                .endDate(LocalDate.parse(endDate))
                .endTime(endTime != null && !endTime.isEmpty() ? LocalTime.parse(endTime) : null)
                .location(location)
                .status(Event.EventStatus.valueOf(status))
                .build();

            if (provinceId != null) {
                Province province = provinceRepository.findById(provinceId)
                    .orElseThrow(() -> new RuntimeException("Province not found"));
                event.setProvince(province);
            }

            eventRepository.save(event);

            // Update the image URL with actual event ID
            if (pictureFile != null && !pictureFile.isEmpty()) {
                String finalImageUrl = s3Service.uploadEventImage(pictureFile, event.getId());
                if (imageUrl != null) {
                    s3Service.deleteEventImage(imageUrl); // Delete temporary image
                }
                event.setPicture(finalImageUrl);
                eventRepository.save(event);
            }

            redirectAttributes.addFlashAttribute("successMessage", "Sự kiện đã được tạo thành công!");
            return "redirect:/admin/events";
        } catch (IOException e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Lỗi khi upload ảnh: " + e.getMessage());
            return "redirect:/admin/events/new";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Lỗi khi tạo sự kiện: " + e.getMessage());
            return "redirect:/admin/events/new";
        }
    }

    @GetMapping("/events/edit/{id}")
    public String editEvent(@PathVariable Long id, Model model) {
        Event event = eventRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Event not found"));

        model.addAttribute("title", "Chỉnh sửa sự kiện");
        model.addAttribute("event", event);
        model.addAttribute("provinces", provinceRepository.findAll());
        model.addAttribute("isNew", false);

        return "admin/event-edit";
    }

    @PostMapping("/events/edit/{id}")
    public String updateEvent(
            @PathVariable Long id,
            @RequestParam String title,
            @RequestParam(required = false) String picture,
            @RequestParam(required = false) MultipartFile pictureFile,
            @RequestParam(required = false) String shortContent,
            @RequestParam(required = false) String content,
            @RequestParam String startDate,
            @RequestParam(required = false) String startTime,
            @RequestParam String endDate,
            @RequestParam(required = false) String endTime,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Long provinceId,
            @RequestParam String status,
            RedirectAttributes redirectAttributes
    ) {
        try {
            Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));

            String oldImageUrl = event.getPicture();

            // Handle image upload if new file is provided
            String imageUrl = picture;
            if (pictureFile != null && !pictureFile.isEmpty()) {
                imageUrl = s3Service.uploadEventImage(pictureFile, id);

                // Delete old image if exists and is different
                if (oldImageUrl != null && !oldImageUrl.isEmpty() && !oldImageUrl.equals(imageUrl)) {
                    s3Service.deleteEventImage(oldImageUrl);
                }
            }

            event.setTitle(title);
            event.setPicture(imageUrl);
            event.setShortContent(shortContent);
            event.setContent(content);
            event.setStartDate(LocalDate.parse(startDate));
            event.setStartTime(startTime != null && !startTime.isEmpty() ? LocalTime.parse(startTime) : null);
            event.setEndDate(LocalDate.parse(endDate));
            event.setEndTime(endTime != null && !endTime.isEmpty() ? LocalTime.parse(endTime) : null);
            event.setLocation(location);

            if (provinceId != null) {
                Province province = provinceRepository.findById(provinceId)
                    .orElseThrow(() -> new RuntimeException("Province not found"));
                event.setProvince(province);
            } else {
                event.setProvince(null);
            }

            event.setStatus(Event.EventStatus.valueOf(status));

            eventRepository.save(event);

            redirectAttributes.addFlashAttribute("successMessage", "Sự kiện đã được cập nhật thành công!");
            return "redirect:/admin/events";
        } catch (IOException e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Lỗi khi upload ảnh: " + e.getMessage());
            return "redirect:/admin/events/edit/" + id;
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Lỗi khi cập nhật sự kiện: " + e.getMessage());
            return "redirect:/admin/events/edit/" + id;
        }
    }

    @PostMapping("/events/delete/{id}")
    public String deleteEvent(@PathVariable Long id) {
        Event event = eventRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Event not found"));

        event.setStatus(Event.EventStatus.DELETED);
        eventRepository.save(event);

        return "redirect:/admin/events";
    }

    @PostMapping("/events/activate/{id}")
    public String activateEvent(@PathVariable Long id) {
        Event event = eventRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Event not found"));

        // Restore to PLAN status when activating
        event.setStatus(Event.EventStatus.PLAN);
        eventRepository.save(event);

        return "redirect:/admin/events";
    }

    @PostMapping("/events/upload-image")
    @ResponseBody
    public Map<String, String> uploadEditorImage(@RequestParam("file") MultipartFile file) {
        try {
            // Validate file
            if (file.isEmpty()) {
                return Map.of("error", "File is empty");
            }

            if (!s3Service.isValidImageFile(file)) {
                return Map.of("error", "Invalid image file type");
            }

            // Upload to S3 with a temporary event ID (0 for editor images)
            String imageUrl = s3Service.uploadEventImage(file, 0L);

            // Return URL in TinyMCE expected format
            return Map.of("location", imageUrl);
        } catch (IOException e) {
            return Map.of("error", "Failed to upload image: " + e.getMessage());
        }
    }

    // ==================== PLAYER ATTRIBUTE TYPES MANAGEMENT ====================

    @GetMapping("/attribute-types")
    public String attributeTypes(
            Model model,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "id"));
        Page<com.elevenof.backoffice.model.PlayerAttributeType> attributeTypePage =
            playerAttributeTypeService.getAllAttributeTypes(pageable);

        model.addAttribute("title", "Quản lý loại chỉ số");
        model.addAttribute("attributeTypes", attributeTypePage.getContent());
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", attributeTypePage.getTotalPages());
        model.addAttribute("totalItems", attributeTypePage.getTotalElements());
        model.addAttribute("pageSize", size);

        return "admin/attribute-types";
    }

    @GetMapping("/attribute-types/new")
    public String newAttributeType(Model model) {
        model.addAttribute("title", "Tạo loại chỉ số mới");
        model.addAttribute("attributeType", null);
        model.addAttribute("isNew", true);

        return "admin/attribute-type-edit";
    }

    @GetMapping("/attribute-types/edit/{id}")
    public String editAttributeType(@PathVariable Long id, Model model) {
        com.elevenof.backoffice.model.PlayerAttributeType attributeType =
            playerAttributeTypeService.getAttributeTypeById(id);

        model.addAttribute("title", "Chỉnh sửa loại chỉ số");
        model.addAttribute("attributeType", attributeType);
        model.addAttribute("isNew", false);

        return "admin/attribute-type-edit";
    }

    @PostMapping("/attribute-types/save")
    public String saveAttributeType(
            @RequestParam(required = false) Long id,
            @RequestParam String attributeKey,
            @RequestParam String attributeName,
            @RequestParam(defaultValue = "false") Boolean isHexagon,
            @RequestParam(defaultValue = "false") Boolean isGoalKeeper,
            @RequestParam(required = false) String attributeGroup,
            RedirectAttributes redirectAttributes
    ) {
        try {
            com.elevenof.backoffice.model.PlayerAttributeType attributeType =
                com.elevenof.backoffice.model.PlayerAttributeType.builder()
                    .attributeKey(attributeKey)
                    .attributeName(attributeName)
                    .isHexagon(isHexagon)
                    .isGoalKeeper(isGoalKeeper)
                    .attributeGroup(attributeGroup)
                    .build();

            if (id != null) {
                // Update existing
                playerAttributeTypeService.updateAttributeType(id, attributeType, "admin");
                redirectAttributes.addFlashAttribute("successMessage", "Cập nhật loại chỉ số thành công!");
            } else {
                // Create new
                playerAttributeTypeService.createAttributeType(attributeType, "admin");
                redirectAttributes.addFlashAttribute("successMessage", "Tạo loại chỉ số mới thành công!");
            }

            return "redirect:/admin/attribute-types";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Lỗi: " + e.getMessage());
            return id != null ?
                "redirect:/admin/attribute-types/edit/" + id :
                "redirect:/admin/attribute-types/new";
        }
    }

    @PostMapping("/attribute-types/delete/{id}")
    public String deleteAttributeType(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        try {
            playerAttributeTypeService.deleteAttributeType(id);
            redirectAttributes.addFlashAttribute("successMessage", "Xóa loại chỉ số thành công!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Lỗi: " + e.getMessage());
        }
        return "redirect:/admin/attribute-types";
    }

    // ==================== PLAYER ATTRIBUTES MANAGEMENT ====================

    @PostMapping("/players/{playerId}/attributes/save")
    public String savePlayerAttributes(
            @PathVariable Long playerId,
            @RequestParam Map<String, String> allParams,
            RedirectAttributes redirectAttributes
    ) {
        try {
            // Filter params that start with "attr_"
            Map<Long, Integer> attributeValues = new java.util.HashMap<>();
            allParams.forEach((key, value) -> {
                if (key.startsWith("attr_") && value != null && !value.isEmpty()) {
                    Long attributeTypeId = Long.parseLong(key.substring(5));
                    Integer attrValue = Integer.parseInt(value);
                    attributeValues.put(attributeTypeId, attrValue);
                }
            });

            playerAttributeService.bulkUpdatePlayerAttributes(playerId, attributeValues, "admin");
            redirectAttributes.addFlashAttribute("successMessage", "Cập nhật chỉ số cầu thủ thành công!");

            return "redirect:/admin/players/" + playerId + "/attributes";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Lỗi: " + e.getMessage());
            return "redirect:/admin/players/" + playerId + "/attributes";
        }
    }

    // Achievement Approval Endpoints
    @PostMapping("/achievements/{achievementId}/approve")
    @ResponseBody
    @org.springframework.transaction.annotation.Transactional
    public Map<String, Object> approveAchievement(@PathVariable Long achievementId) {
        com.elevenof.backoffice.model.PlayerAchievement achievement =
                playerAchievementRepository.findById(achievementId)
                        .orElseThrow(() -> new RuntimeException("Achievement not found"));

        achievement.setApprovalStatus(com.elevenof.backoffice.model.PlayerAchievement.ApprovalStatus.APPROVED);
        playerAchievementRepository.save(achievement);

        // Send notification to player
        Player player = achievement.getPlayer();
        Map<String, String> variables = Map.of(
            "fullName", player.getUser().getFullName(),
            "achievementTitle", achievement.getTitle()
        );
        String data = String.format("{\"achievementId\": %d}", achievement.getId());
        eventPublisher.publishEvent(new com.elevenof.backoffice.event.NotificationEvent(
            this, player.getUser().getId(), "ACHIEVEMENT_APPROVED", variables, data
        ));

        return Map.of("success", true, "approvalStatus", "APPROVED");
    }

    @PostMapping("/achievements/{achievementId}/reject")
    @ResponseBody
    @org.springframework.transaction.annotation.Transactional
    public Map<String, Object> rejectAchievement(@PathVariable Long achievementId) {
        com.elevenof.backoffice.model.PlayerAchievement achievement =
                playerAchievementRepository.findById(achievementId)
                        .orElseThrow(() -> new RuntimeException("Achievement not found"));

        achievement.setApprovalStatus(com.elevenof.backoffice.model.PlayerAchievement.ApprovalStatus.REJECTED);
        playerAchievementRepository.save(achievement);

        return Map.of("success", true, "approvalStatus", "REJECTED");
    }

    // Highlight Approval Endpoints
    @PostMapping("/highlights/{highlightId}/approve")
    @ResponseBody
    @org.springframework.transaction.annotation.Transactional
    public Map<String, Object> approveHighlight(@PathVariable Long highlightId) {
        com.elevenof.backoffice.model.PlayerHighlight highlight =
                playerHighlightRepository.findById(highlightId)
                        .orElseThrow(() -> new RuntimeException("Highlight not found"));

        highlight.setApprovalStatus(com.elevenof.backoffice.model.PlayerHighlight.ApprovalStatus.APPROVED);
        playerHighlightRepository.save(highlight);

        // Send notification to player
        Player player = highlight.getPlayer();
        Map<String, String> variables = Map.of(
            "fullName", player.getUser().getFullName(),
            "highlightDescription", highlight.getTitle() != null ? highlight.getTitle() : "Video highlight"
        );
        String data = String.format("{\"highlightId\": %d}", highlight.getId());
        eventPublisher.publishEvent(new com.elevenof.backoffice.event.NotificationEvent(
            this, player.getUser().getId(), "HIGHLIGHT_APPROVED", variables, data
        ));

        return Map.of("success", true, "approvalStatus", "APPROVED");
    }

    @PostMapping("/highlights/{highlightId}/reject")
    @ResponseBody
    @org.springframework.transaction.annotation.Transactional
    public Map<String, Object> rejectHighlight(@PathVariable Long highlightId) {
        com.elevenof.backoffice.model.PlayerHighlight highlight =
                playerHighlightRepository.findById(highlightId)
                        .orElseThrow(() -> new RuntimeException("Highlight not found"));

        highlight.setApprovalStatus(com.elevenof.backoffice.model.PlayerHighlight.ApprovalStatus.REJECTED);
        playerHighlightRepository.save(highlight);

        return Map.of("success", true, "approvalStatus", "REJECTED");
    }

    // ==================== SYNTHETIC ATTRIBUTES MANAGEMENT ====================

    /**
     * Generate synthetic attributes for individual player
     */
    @PostMapping("/players/{id}/attributes/generate")
    public String generateSyntheticAttributes(
            @PathVariable Long id,
            RedirectAttributes redirectAttributes,
            HttpServletRequest request
    ) {
        try {
            String adminUsername = request.getUserPrincipal().getName();
            playerAttributeService.generateAndSaveSyntheticAttributes(id, adminUsername);
            redirectAttributes.addFlashAttribute("successMessage", "Đã tạo synthetic attributes thành công");
        } catch (Exception e) {
            System.err.println("Failed to generate synthetic attributes: " + e.getMessage());
            e.printStackTrace();
            redirectAttributes.addFlashAttribute("errorMessage", "Lỗi khi tạo synthetic attributes: " + e.getMessage());
        }
        return "redirect:/admin/players/" + id + "/attributes";
    }

    /**
     * View player attributes management page
     */
    @GetMapping("/players/{id}/attributes")
    public String viewPlayerAttributes(@PathVariable Long id, Model model) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        // Get attribute statuses
        boolean hasSyntheticAttributes = playerAttributeService.hasSyntheticAttributes(id);
        boolean hasRealAttributes = playerAttributeService.hasRealAttributes(id);

        model.addAttribute("title", "Quản lý Attributes");
        model.addAttribute("player", player);
        model.addAttribute("hasSyntheticAttributes", hasSyntheticAttributes);
        model.addAttribute("hasRealAttributes", hasRealAttributes);
        model.addAttribute("generationTimestamp", playerAttributeService.getGenerationTimestamp(id));

        // Get real and synthetic attributes separately
        if (hasRealAttributes) {
            List<com.elevenof.backoffice.dto.response.PlayerAttributeDTO> realAttrs =
                    playerAttributeRepository.findByPlayerIdAndIsSynthetic(id, false).stream()
                            .map(pa -> com.elevenof.backoffice.dto.response.PlayerAttributeDTO.builder()
                                    .attributeKey(pa.getAttributeType().getAttributeKey())
                                    .attributeName(pa.getAttributeType().getAttributeName())
                                    .attributeValue(pa.getAttributeValue())
                                    .attributeGroup(pa.getAttributeType().getAttributeGroup())
                                    .isSynthetic(false)
                                    .build())
                            .collect(java.util.stream.Collectors.toList());
            model.addAttribute("realAttributes", realAttrs);
        }

        if (hasSyntheticAttributes) {
            List<com.elevenof.backoffice.dto.response.PlayerAttributeDTO> syntheticAttrs =
                    playerAttributeRepository.findByPlayerIdAndIsSynthetic(id, true).stream()
                            .map(pa -> com.elevenof.backoffice.dto.response.PlayerAttributeDTO.builder()
                                    .attributeKey(pa.getAttributeType().getAttributeKey())
                                    .attributeName(pa.getAttributeType().getAttributeName())
                                    .attributeValue(pa.getAttributeValue())
                                    .attributeGroup(pa.getAttributeType().getAttributeGroup())
                                    .isSynthetic(true)
                                    .generationTimestamp(pa.getGenerationTimestamp())
                                    .build())
                            .collect(java.util.stream.Collectors.toList());
            model.addAttribute("syntheticAttributes", syntheticAttrs);
        }

        return "admin/player-attributes";
    }

    /**
     * Bulk generate synthetic attributes for players without attributes
     */
    @PostMapping("/players/bulk-generate-attributes")
    public String bulkGenerateSyntheticAttributes(
            RedirectAttributes redirectAttributes,
            HttpServletRequest request
    ) {
        try {
            String adminUsername = request.getUserPrincipal().getName();

            // Find all players without any attributes
            List<Player> playersWithoutAttributes = playerRepository.findAll().stream()
                    .filter(player -> playerAttributeService.getPlayerAttributes(player.getId()).isEmpty())
                    .toList();

            if (playersWithoutAttributes.isEmpty()) {
                redirectAttributes.addFlashAttribute("info", "Không có cầu thủ nào cần tạo attributes");
                return "redirect:/admin/players";
            }

            List<Long> userIds = playersWithoutAttributes.stream()
                    .map(player -> player.getUser().getId())
                    .toList();

            playerAttributeService.bulkGenerateSyntheticAttributes(userIds, adminUsername);

            redirectAttributes.addFlashAttribute("successMessage",
                    "Đã tạo synthetic attributes cho " + userIds.size() + " cầu thủ");
        } catch (Exception e) {
            System.err.println("Failed to bulk generate synthetic attributes: " + e.getMessage());
            e.printStackTrace();
            redirectAttributes.addFlashAttribute("errorMessage",
                    "Lỗi khi tạo bulk synthetic attributes: " + e.getMessage());
        }
        return "redirect:/admin/players";
    }

    /**
     * Switch player to use synthetic attributes
     */
    @PostMapping("/players/{id}/attributes/switch-to-synthetic")
    public String switchToSyntheticAttributes(
            @PathVariable Long id,
            RedirectAttributes redirectAttributes,
            HttpServletRequest request
    ) {
        try {
            String adminUsername = request.getUserPrincipal().getName();
            playerAttributeService.switchToSyntheticAttributes(id, adminUsername);
            redirectAttributes.addFlashAttribute("successMessage", "Đã chuyển sang sử dụng synthetic attributes");
        } catch (Exception e) {
            System.err.println("Failed to switch to synthetic attributes: " + e.getMessage());
            e.printStackTrace();
            redirectAttributes.addFlashAttribute("errorMessage", "Lỗi: " + e.getMessage());
        }
        return "redirect:/admin/players/" + id + "/attributes";
    }

    /**
     * Switch player to use real attributes (delete synthetic)
     */
    @PostMapping("/players/{id}/attributes/switch-to-real")
    public String switchToRealAttributes(
            @PathVariable Long id,
            RedirectAttributes redirectAttributes
    ) {
        try {
            playerAttributeService.switchToRealAttributes(id);
            redirectAttributes.addFlashAttribute("successMessage",
                    "Đã xóa synthetic attributes, giữ lại real attributes");
        } catch (Exception e) {
            System.err.println("Failed to switch to real attributes: " + e.getMessage());
            e.printStackTrace();
            redirectAttributes.addFlashAttribute("errorMessage", "Lỗi: " + e.getMessage());
        }
        return "redirect:/admin/players/" + id + "/attributes";
    }

    // ==================== NOTIFICATION MANAGEMENT ====================

    /**
     * Notification scenarios management page
     */
    @GetMapping("/notifications")
    public String notificationScenarios(Model model) {
        model.addAttribute("title", "Quản lý thông báo");
        model.addAttribute("scenarios", notificationScenarioRepository.findAll());
        return "admin/notifications";
    }

    /**
     * Update notification scenario channel toggles
     */
    @PostMapping("/notifications/scenarios/{id}")
    @ResponseBody
    @org.springframework.transaction.annotation.Transactional
    public Map<String, Object> updateScenarioChannels(
            @PathVariable Long id,
            @RequestParam(required = false) Boolean emailEnabled,
            @RequestParam(required = false) Boolean inappEnabled,
            @RequestParam(required = false) Boolean znsEnabled
    ) {
        try {
            com.elevenof.backoffice.model.NotificationScenario scenario = notificationScenarioRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Scenario not found"));

            if (emailEnabled != null) scenario.setEmailEnabled(emailEnabled);
            if (inappEnabled != null) scenario.setInappEnabled(inappEnabled);
            if (znsEnabled != null) scenario.setZnsEnabled(znsEnabled);

            notificationScenarioRepository.save(scenario);

            return Map.of("success", true, "message", "Cập nhật thành công");
        } catch (Exception e) {
            return Map.of("success", false, "message", e.getMessage());
        }
    }

    /**
     * Template management page for a scenario
     */
    @GetMapping("/notifications/templates/{scenarioId}")
    public String notificationTemplates(@PathVariable Long scenarioId, Model model) {
        com.elevenof.backoffice.model.NotificationScenario scenario = notificationScenarioRepository.findById(scenarioId)
                .orElseThrow(() -> new RuntimeException("Scenario not found"));

        model.addAttribute("title", "Quản lý template - " + scenario.getName());
        model.addAttribute("scenario", scenario);
        model.addAttribute("templates", notificationTemplateService.getTemplatesByScenario(scenarioId));
        return "admin/notification-templates";
    }

    /**
     * Update notification template
     */
    @PostMapping("/notifications/templates/{id}")
    public String updateTemplate(
            @PathVariable Long id,
            @RequestParam String subject,
            @RequestParam String bodyTemplate,
            @RequestParam Boolean active,
            RedirectAttributes redirectAttributes
    ) {
        try {
            com.elevenof.backoffice.model.NotificationTemplate template = notificationTemplateService.getTemplateById(id)
                    .orElseThrow(() -> new RuntimeException("Template not found"));

            template.setSubject(subject);
            template.setBodyTemplate(bodyTemplate);
            template.setActive(active);
            notificationTemplateService.saveTemplate(template);

            redirectAttributes.addFlashAttribute("successMessage", "Cập nhật template thành công");
            return "redirect:/admin/notifications/templates/" + template.getScenario().getId();
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Lỗi: " + e.getMessage());
            return "redirect:/admin/notifications";
        }
    }

    // ==================== COMPETITION NEWS MANAGEMENT ====================

    @GetMapping("/competitions/{id}/news")
    public String competitionNews(@PathVariable Long id, Model model) {
        com.elevenof.backoffice.model.Competition competition = competitionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Competition not found"));
        java.util.List<com.elevenof.backoffice.model.CompetitionNews> newsList =
                competitionNewsRepository.findByCompetitionIdOrderByCreatedAtDesc(id);
        model.addAttribute("title", "Quản lý tin tức - " + competition.getTitle());
        model.addAttribute("competition", competition);
        model.addAttribute("newsList", newsList);
        return "admin/competition-news";
    }

    @GetMapping("/competitions/{id}/news/new")
    public String competitionNewsNew(@PathVariable Long id, Model model) {
        com.elevenof.backoffice.model.Competition competition = competitionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Competition not found"));
        java.util.List<com.elevenof.backoffice.model.Competition> allCompetitions = competitionRepository.findAll();
        model.addAttribute("title", "Tạo tin tức mới");
        model.addAttribute("competition", competition);
        model.addAttribute("allCompetitions", allCompetitions);
        model.addAttribute("news", null);
        return "admin/competition-news-edit";
    }

    @PostMapping("/competitions/{id}/news/new")
    public String competitionNewsCreate(
            @PathVariable Long id,
            @RequestParam String title,
            @RequestParam(required = false) String shortContent,
            @RequestParam(required = false) String content,
            @RequestParam(required = false) String authorByline,
            @RequestParam(required = false) MultipartFile thumbnailFile,
            @RequestParam(required = false) String thumbnailUrl,
            @RequestParam(defaultValue = "false") boolean isFeatured,
            @RequestParam(defaultValue = "DRAFT") String status,
            @RequestParam Long competitionId,
            RedirectAttributes redirectAttributes) {

        com.elevenof.backoffice.model.Competition competition = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new RuntimeException("Competition not found"));

        String adminUsername = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getName();
        com.elevenof.backoffice.model.User author = userRepository.findByPhone(adminUsername).orElse(null);

        com.elevenof.backoffice.model.CompetitionNews news = new com.elevenof.backoffice.model.CompetitionNews();
        news.setCompetition(competition);
        news.setTitle(title);
        news.setShortContent(shortContent);
        news.setContent(content != null ? content : "");
        news.setAuthorByline(authorByline != null && !authorByline.isBlank() ? authorByline : null);
        news.setAuthor(author);
        news.setIsFeatured(isFeatured);
        news.setStatus(com.elevenof.backoffice.model.NewsStatus.valueOf(status));
        if (status.equals("PUBLISHED")) {
            news.setPublishedAt(java.time.LocalDateTime.now());
        }

        com.elevenof.backoffice.model.CompetitionNews saved = competitionNewsRepository.save(news);

        // Handle thumbnail upload
        String finalThumbnail = thumbnailUrl;
        if (thumbnailFile != null && !thumbnailFile.isEmpty()) {
            try {
                finalThumbnail = s3Service.uploadNewsImage(thumbnailFile, saved.getId());
            } catch (Exception e) {
                redirectAttributes.addFlashAttribute("warning", "Không thể upload ảnh: " + e.getMessage());
            }
        }
        if (finalThumbnail != null && !finalThumbnail.isBlank()) {
            saved.setThumbnail(finalThumbnail);
            competitionNewsRepository.save(saved);
        }

        redirectAttributes.addFlashAttribute("success", "Đã tạo tin tức thành công!");
        return "redirect:/admin/competitions/" + id + "/news";
    }

    @GetMapping("/competitions/{id}/news/{newsId}/edit")
    public String competitionNewsEdit(@PathVariable Long id, @PathVariable Long newsId, Model model) {
        com.elevenof.backoffice.model.Competition competition = competitionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Competition not found"));
        com.elevenof.backoffice.model.CompetitionNews news = competitionNewsRepository.findById(newsId)
                .orElseThrow(() -> new RuntimeException("News not found"));
        java.util.List<com.elevenof.backoffice.model.Competition> allCompetitions = competitionRepository.findAll();
        model.addAttribute("title", "Chỉnh sửa tin tức");
        model.addAttribute("competition", competition);
        model.addAttribute("allCompetitions", allCompetitions);
        model.addAttribute("news", news);
        return "admin/competition-news-edit";
    }

    @PostMapping("/competitions/{id}/news/{newsId}/edit")
    public String competitionNewsUpdate(
            @PathVariable Long id,
            @PathVariable Long newsId,
            @RequestParam String title,
            @RequestParam(required = false) String shortContent,
            @RequestParam(required = false) String content,
            @RequestParam(required = false) String authorByline,
            @RequestParam(required = false) MultipartFile thumbnailFile,
            @RequestParam(required = false) String thumbnailUrl,
            @RequestParam(defaultValue = "false") boolean isFeatured,
            @RequestParam(defaultValue = "DRAFT") String status,
            @RequestParam Long competitionId,
            RedirectAttributes redirectAttributes) {

        com.elevenof.backoffice.model.Competition competition = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new RuntimeException("Competition not found"));
        com.elevenof.backoffice.model.CompetitionNews news = competitionNewsRepository.findById(newsId)
                .orElseThrow(() -> new RuntimeException("News not found"));

        news.setCompetition(competition);
        news.setTitle(title);
        news.setShortContent(shortContent);
        news.setContent(content != null ? content : "");
        news.setAuthorByline(authorByline != null && !authorByline.isBlank() ? authorByline : null);
        news.setIsFeatured(isFeatured);

        com.elevenof.backoffice.model.NewsStatus newStatus = com.elevenof.backoffice.model.NewsStatus.valueOf(status);
        if (newStatus == com.elevenof.backoffice.model.NewsStatus.PUBLISHED && news.getPublishedAt() == null) {
            news.setPublishedAt(java.time.LocalDateTime.now());
        }
        news.setStatus(newStatus);

        if (thumbnailFile != null && !thumbnailFile.isEmpty()) {
            try {
                String oldThumbnail = news.getThumbnail();
                String newUrl = s3Service.uploadNewsImage(thumbnailFile, newsId);
                news.setThumbnail(newUrl);
                if (oldThumbnail != null && !oldThumbnail.isBlank()) {
                    s3Service.deleteEventImage(oldThumbnail);
                }
            } catch (Exception e) {
                redirectAttributes.addFlashAttribute("warning", "Không thể upload ảnh: " + e.getMessage());
            }
        } else if (thumbnailUrl != null && !thumbnailUrl.isBlank()) {
            news.setThumbnail(thumbnailUrl);
        }

        competitionNewsRepository.save(news);
        redirectAttributes.addFlashAttribute("success", "Đã cập nhật tin tức thành công!");
        return "redirect:/admin/competitions/" + id + "/news";
    }

    @PostMapping("/competitions/{id}/news/{newsId}/delete")
    public String competitionNewsDelete(
            @PathVariable Long id,
            @PathVariable Long newsId,
            RedirectAttributes redirectAttributes) {
        com.elevenof.backoffice.model.CompetitionNews news = competitionNewsRepository.findById(newsId)
                .orElseThrow(() -> new RuntimeException("News not found"));
        news.setStatus(com.elevenof.backoffice.model.NewsStatus.DRAFT);
        news.setPublishedAt(null);
        competitionNewsRepository.save(news);
        redirectAttributes.addFlashAttribute("success", "Đã chuyển tin tức về DRAFT!");
        return "redirect:/admin/competitions/" + id + "/news";
    }

    @PostMapping("/competitions/{id}/news/{newsId}/toggle-featured")
    public String competitionNewsToggleFeatured(
            @PathVariable Long id,
            @PathVariable Long newsId,
            RedirectAttributes redirectAttributes) {
        com.elevenof.backoffice.model.CompetitionNews news = competitionNewsRepository.findById(newsId)
                .orElseThrow(() -> new RuntimeException("News not found"));
        news.setIsFeatured(!news.getIsFeatured());
        competitionNewsRepository.save(news);
        return "redirect:/admin/competitions/" + id + "/news";
    }

    @PostMapping("/competitions/{id}/news/{newsId}/publish")
    public String competitionNewsPublish(
            @PathVariable Long id,
            @PathVariable Long newsId,
            RedirectAttributes redirectAttributes) {
        com.elevenof.backoffice.model.CompetitionNews news = competitionNewsRepository.findById(newsId)
                .orElseThrow(() -> new RuntimeException("News not found"));
        news.setStatus(com.elevenof.backoffice.model.NewsStatus.PUBLISHED);
        if (news.getPublishedAt() == null) {
            news.setPublishedAt(java.time.LocalDateTime.now());
        }
        competitionNewsRepository.save(news);
        redirectAttributes.addFlashAttribute("success", "Đã xuất bản tin tức!");
        return "redirect:/admin/competitions/" + id + "/news";
    }

    @PostMapping("/news/upload-image")
    @ResponseBody
    public java.util.Map<String, String> uploadNewsEditorImage(
            @RequestParam("file") MultipartFile file) {
        try {
            if (!s3Service.isValidImageFile(file)) {
                return java.util.Map.of("error", "Invalid image file");
            }
            String url = s3Service.uploadNewsImage(file, 0L);
            return java.util.Map.of("location", url);
        } catch (Exception e) {
            return java.util.Map.of("error", e.getMessage());
        }
    }

    // ==================== COMPETITION SPONSORS MANAGEMENT ====================

    @GetMapping("/competitions/{id}/sponsors")
    public String competitionSponsors(@PathVariable Long id, Model model) {
        com.elevenof.backoffice.model.Competition competition = competitionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Competition not found"));
        java.util.List<com.elevenof.backoffice.model.CompetitionSponsor> sponsors =
                competitionSponsorRepository.findByCompetitionIdOrderByDisplayOrderAsc(id);
        model.addAttribute("title", "Quản lý nhà tài trợ - " + competition.getTitle());
        model.addAttribute("competition", competition);
        model.addAttribute("sponsors", sponsors);
        return "admin/competition-sponsors";
    }

    @GetMapping("/competitions/{id}/sponsors/new")
    public String competitionSponsorNew(@PathVariable Long id, Model model) {
        com.elevenof.backoffice.model.Competition competition = competitionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Competition not found"));
        model.addAttribute("title", "Thêm nhà tài trợ");
        model.addAttribute("competition", competition);
        model.addAttribute("sponsor", null);
        return "admin/competition-sponsors-edit";
    }

    @PostMapping("/competitions/{id}/sponsors/new")
    public String competitionSponsorCreate(
            @PathVariable Long id,
            @RequestParam String name,
            @RequestParam(required = false) String websiteUrl,
            @RequestParam(required = false) MultipartFile logoFile,
            @RequestParam(required = false) String logoUrl,
            @RequestParam(required = false) MultipartFile bannerFile,
            @RequestParam(required = false) String bannerImageUrl,
            @RequestParam(required = false) String adPosition,
            @RequestParam(defaultValue = "0") Integer displayOrder,
            @RequestParam(defaultValue = "true") boolean isActive,
            RedirectAttributes redirectAttributes) {

        com.elevenof.backoffice.model.Competition competition = competitionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Competition not found"));

        com.elevenof.backoffice.model.CompetitionSponsor sponsor = new com.elevenof.backoffice.model.CompetitionSponsor();
        sponsor.setCompetition(competition);
        sponsor.setName(name);
        sponsor.setWebsiteUrl(websiteUrl);
        sponsor.setDisplayOrder(displayOrder);
        sponsor.setIsActive(isActive);
        sponsor.setAdPosition(adPosition != null && !adPosition.isBlank() ? adPosition : null);

        com.elevenof.backoffice.model.CompetitionSponsor saved = competitionSponsorRepository.save(sponsor);

        // Logo upload
        String finalLogoUrl = logoUrl;
        if (logoFile != null && !logoFile.isEmpty()) {
            try { finalLogoUrl = s3Service.uploadSponsorImage(logoFile, saved.getId()); }
            catch (Exception e) { redirectAttributes.addFlashAttribute("warning", "Không thể upload logo: " + e.getMessage()); }
        }
        if (finalLogoUrl != null && !finalLogoUrl.isBlank()) saved.setLogoUrl(finalLogoUrl);

        // Banner upload
        String finalBannerUrl = bannerImageUrl;
        if (bannerFile != null && !bannerFile.isEmpty()) {
            try { finalBannerUrl = s3Service.uploadSponsorImage(bannerFile, saved.getId()); }
            catch (Exception e) { redirectAttributes.addFlashAttribute("warning", "Không thể upload banner: " + e.getMessage()); }
        }
        if (finalBannerUrl != null && !finalBannerUrl.isBlank()) saved.setBannerImageUrl(finalBannerUrl);

        competitionSponsorRepository.save(saved);
        redirectAttributes.addFlashAttribute("success", "Đã thêm nhà tài trợ thành công!");
        return "redirect:/admin/competitions/" + id + "/sponsors";
    }

    @GetMapping("/competitions/{id}/sponsors/{sId}/edit")
    public String competitionSponsorEdit(@PathVariable Long id, @PathVariable Long sId, Model model) {
        com.elevenof.backoffice.model.Competition competition = competitionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Competition not found"));
        com.elevenof.backoffice.model.CompetitionSponsor sponsor = competitionSponsorRepository.findById(sId)
                .orElseThrow(() -> new RuntimeException("Sponsor not found"));
        model.addAttribute("title", "Chỉnh sửa nhà tài trợ");
        model.addAttribute("competition", competition);
        model.addAttribute("sponsor", sponsor);
        return "admin/competition-sponsors-edit";
    }

    @PostMapping("/competitions/{id}/sponsors/{sId}/edit")
    public String competitionSponsorUpdate(
            @PathVariable Long id,
            @PathVariable Long sId,
            @RequestParam String name,
            @RequestParam(required = false) String websiteUrl,
            @RequestParam(required = false) MultipartFile logoFile,
            @RequestParam(required = false) String logoUrl,
            @RequestParam(required = false) MultipartFile bannerFile,
            @RequestParam(required = false) String bannerImageUrl,
            @RequestParam(required = false) String adPosition,
            @RequestParam(defaultValue = "0") Integer displayOrder,
            @RequestParam(defaultValue = "true") boolean isActive,
            RedirectAttributes redirectAttributes) {

        com.elevenof.backoffice.model.CompetitionSponsor sponsor = competitionSponsorRepository.findById(sId)
                .orElseThrow(() -> new RuntimeException("Sponsor not found"));
        sponsor.setName(name);
        sponsor.setWebsiteUrl(websiteUrl);
        sponsor.setDisplayOrder(displayOrder);
        sponsor.setIsActive(isActive);
        sponsor.setAdPosition(adPosition != null && !adPosition.isBlank() ? adPosition : null);

        if (logoFile != null && !logoFile.isEmpty()) {
            try {
                String old = sponsor.getLogoUrl();
                sponsor.setLogoUrl(s3Service.uploadSponsorImage(logoFile, sId));
                if (old != null && !old.isBlank()) s3Service.deleteEventImage(old);
            } catch (Exception e) { redirectAttributes.addFlashAttribute("warning", "Không thể upload logo: " + e.getMessage()); }
        } else if (logoUrl != null && !logoUrl.isBlank()) {
            sponsor.setLogoUrl(logoUrl);
        }

        if (bannerFile != null && !bannerFile.isEmpty()) {
            try {
                String old = sponsor.getBannerImageUrl();
                sponsor.setBannerImageUrl(s3Service.uploadSponsorImage(bannerFile, sId));
                if (old != null && !old.isBlank()) s3Service.deleteEventImage(old);
            } catch (Exception e) { redirectAttributes.addFlashAttribute("warning", "Không thể upload banner: " + e.getMessage()); }
        } else if (bannerImageUrl != null && !bannerImageUrl.isBlank()) {
            sponsor.setBannerImageUrl(bannerImageUrl);
        }

        competitionSponsorRepository.save(sponsor);
        redirectAttributes.addFlashAttribute("success", "Đã cập nhật nhà tài trợ!");
        return "redirect:/admin/competitions/" + id + "/sponsors";
    }

    @PostMapping("/competitions/{id}/sponsors/{sId}/toggle")
    public String competitionSponsorToggle(@PathVariable Long id, @PathVariable Long sId,
            RedirectAttributes redirectAttributes) {
        com.elevenof.backoffice.model.CompetitionSponsor sponsor = competitionSponsorRepository.findById(sId)
                .orElseThrow(() -> new RuntimeException("Sponsor not found"));
        sponsor.setIsActive(!sponsor.getIsActive());
        competitionSponsorRepository.save(sponsor);
        return "redirect:/admin/competitions/" + id + "/sponsors";
    }

    @PostMapping("/competitions/{id}/sponsors/{sId}/delete")
    public String competitionSponsorDelete(@PathVariable Long id, @PathVariable Long sId,
            RedirectAttributes redirectAttributes) {
        com.elevenof.backoffice.model.CompetitionSponsor sponsor = competitionSponsorRepository.findById(sId)
                .orElseThrow(() -> new RuntimeException("Sponsor not found"));
        try { if (sponsor.getLogoUrl() != null) s3Service.deleteEventImage(sponsor.getLogoUrl()); } catch (Exception ignored) {}
        try { if (sponsor.getBannerImageUrl() != null) s3Service.deleteEventImage(sponsor.getBannerImageUrl()); } catch (Exception ignored) {}
        competitionSponsorRepository.delete(sponsor);
        redirectAttributes.addFlashAttribute("success", "Đã xóa nhà tài trợ!");
        return "redirect:/admin/competitions/" + id + "/sponsors";
    }

    @PostMapping("/sponsor/upload-image")
    @ResponseBody
    public java.util.Map<String, String> uploadSponsorEditorImage(@RequestParam("file") MultipartFile file) {
        try {
            if (!s3Service.isValidImageFile(file)) return java.util.Map.of("error", "Invalid image file");
            String url = s3Service.uploadSponsorImage(file, 0L);
            return java.util.Map.of("location", url);
        } catch (Exception e) {
            return java.util.Map.of("error", e.getMessage());
        }
    }

    // ==================== FIELD SCORING ====================

    @GetMapping("/field-scoring")
    public String fieldScoring(
            @RequestParam(required = false) Long stageId,
            @RequestParam(required = false) Long dayId,
            @RequestParam(required = false) Long stepId,
            @RequestParam(required = false) String sbd,
            @RequestParam(required = false) Long participantId,
            @RequestParam(defaultValue = "0") int historyPage,
            Model model) {

        // Find current active competition
        java.util.List<com.elevenof.backoffice.model.Competition> activeComps =
            competitionRepository.findByStatusNotInOrderBySeasonDesc(
                java.util.List.of(
                    com.elevenof.backoffice.model.CompetitionStatus.DRAFT,
                    com.elevenof.backoffice.model.CompetitionStatus.COMPLETED
                )
            );

        com.elevenof.backoffice.model.Competition competition = activeComps.isEmpty() ? null : activeComps.get(0);
        model.addAttribute("competition", competition);

        if (competition == null) {
            model.addAttribute("title", "Nhập điểm hiện trường");
            return "admin/field-scoring";
        }

        // Find LIVE stage
        com.elevenof.backoffice.model.CompetitionStage liveStage = null;
        if (stageId != null) {
            liveStage = competitionStageRepository.findById(stageId).orElse(null);
        } else {
            java.util.List<com.elevenof.backoffice.model.CompetitionStage> stages =
                competitionStageRepository.findByCompetitionIdOrderByStageNumberAsc(competition.getId());
            for (com.elevenof.backoffice.model.CompetitionStage s : stages) {
                if (s.getStatus() == com.elevenof.backoffice.model.StageStatus.LIVE) {
                    liveStage = s;
                    break;
                }
            }
        }

        model.addAttribute("title", "Nhập điểm hiện trường");
        model.addAttribute("liveStage", liveStage);

        if (liveStage == null) {
            return "admin/field-scoring";
        }

        // Load assessment days for stage
        java.util.List<com.elevenof.backoffice.model.CompetitionAssessmentDay> days =
            assessmentDayRepository.findByStageIdOrderByDisplayOrderAsc(liveStage.getId());
        model.addAttribute("days", days);

        com.elevenof.backoffice.model.CompetitionAssessmentDay selectedDay = null;
        if (dayId != null) {
            for (com.elevenof.backoffice.model.CompetitionAssessmentDay d : days) {
                if (d.getId().equals(dayId)) { selectedDay = d; break; }
            }
        }
        model.addAttribute("selectedDay", selectedDay);

        java.util.List<com.elevenof.backoffice.model.CompetitionAssessmentStep> steps = java.util.Collections.emptyList();
        com.elevenof.backoffice.model.CompetitionAssessmentStep selectedStep = null;
        if (selectedDay != null) {
            steps = assessmentStepRepository.findByAssessmentDayIdOrderByDisplayOrderAsc(selectedDay.getId());
            if (stepId != null) {
                for (com.elevenof.backoffice.model.CompetitionAssessmentStep st : steps) {
                    if (st.getId().equals(stepId)) { selectedStep = st; break; }
                }
            }
        }
        model.addAttribute("steps", steps);
        model.addAttribute("selectedStep", selectedStep);

        java.util.List<com.elevenof.backoffice.model.CompetitionAssessment> assessments = java.util.Collections.emptyList();
        if (selectedStep != null) {
            assessments = assessmentRepository.findByAssessmentStepIdOrderByDisplayOrderAsc(selectedStep.getId());
        }
        model.addAttribute("assessments", assessments);

        // Participant lookup by SBD
        com.elevenof.backoffice.model.CompetitionParticipant selectedParticipant = null;
        String resolvedSbd = sbd;
        java.util.List<com.elevenof.backoffice.model.CompetitionParticipant> allParticipants =
            competitionParticipantRepository.findByCompetitionIdWithUserOrderByRegistrationDate(competition.getId());

        if (participantId != null) {
            for (int i = 0; i < allParticipants.size(); i++) {
                if (allParticipants.get(i).getId().equals(participantId)) {
                    selectedParticipant = allParticipants.get(i);
                    resolvedSbd = String.valueOf(i + 1);
                    break;
                }
            }
        } else if (sbd != null && !sbd.isBlank()) {
            try {
                int sbdNum = Integer.parseInt(sbd.trim());
                if (sbdNum >= 1 && sbdNum <= allParticipants.size()) {
                    selectedParticipant = allParticipants.get(sbdNum - 1);
                } else {
                    model.addAttribute("sbdError", "Không tìm thấy thí sinh với SBD: " + sbd);
                }
            } catch (NumberFormatException e) {
                model.addAttribute("sbdError", "SBD không hợp lệ");
            }
        }
        model.addAttribute("sbd", resolvedSbd);
        model.addAttribute("selectedParticipant", selectedParticipant);

        // Load existing scores if participant + step selected
        if (selectedParticipant != null && !assessments.isEmpty()) {
            java.util.Map<String, java.math.BigDecimal> scoreValues = new java.util.HashMap<>();
            for (com.elevenof.backoffice.model.CompetitionAssessment a : assessments) {
                java.util.List<com.elevenof.backoffice.model.CompetitionAssessmentResult> results =
                    assessmentResultRepository.findByAssessmentIdAndParticipantIdOrderByAttemptNumberAsc(
                        a.getId(), selectedParticipant.getId());
                for (com.elevenof.backoffice.model.CompetitionAssessmentResult r : results) {
                    scoreValues.put(a.getId() + "_" + r.getAttemptNumber(), r.getResultValue());
                }
            }
            model.addAttribute("scoreValues", scoreValues);
        }

        // History: participants who already have scores for this step
        if (selectedStep != null) {
            int historySize = 10;
            org.springframework.data.domain.Pageable historyPageable =
                org.springframework.data.domain.PageRequest.of(historyPage, historySize);
            java.util.List<Long> historyParticipantIds =
                assessmentResultRepository.findDistinctParticipantIdsByStepId(selectedStep.getId(), historyPageable);
            long historyTotal = assessmentResultRepository.countDistinctParticipantsByStepId(selectedStep.getId());
            long totalAssessmentsInStep = assessments.stream()
                .mapToLong(a -> a.getAttemptsCount())
                .sum();

            java.util.List<java.util.Map<String, Object>> historyList = new java.util.ArrayList<>();
            for (int i = 0; i < historyParticipantIds.size(); i++) {
                Long pid = historyParticipantIds.get(i);
                com.elevenof.backoffice.model.CompetitionParticipant hp =
                    allParticipants.stream().filter(p -> p.getId().equals(pid)).findFirst().orElse(null);
                if (hp == null) continue;
                int sbdPos = allParticipants.indexOf(hp) + 1;
                long filled = assessmentResultRepository.countFilledAssessmentsByStepAndParticipant(selectedStep.getId(), pid);
                java.util.Map<String, Object> entry = new java.util.HashMap<>();
                entry.put("sbd", sbdPos);
                entry.put("participantId", pid);
                entry.put("fullName", hp.getUser().getFullName());
                entry.put("filled", filled);
                entry.put("total", totalAssessmentsInStep);
                historyList.add(entry);
            }
            model.addAttribute("historyList", historyList);
            model.addAttribute("historyPage", historyPage);
            model.addAttribute("historyTotalPages", (int) Math.ceil((double) historyTotal / historySize));
        }

        return "admin/field-scoring";
    }

    @PostMapping("/field-scoring/save")
    public String fieldScoringSave(
            @RequestParam Long stageId,
            @RequestParam Long dayId,
            @RequestParam Long stepId,
            @RequestParam Long participantId,
            @RequestParam java.util.Map<String, String> allParams,
            RedirectAttributes redirectAttributes) {

        try {
            java.util.List<com.elevenof.backoffice.model.CompetitionAssessment> assessments =
                assessmentRepository.findByAssessmentStepIdOrderByDisplayOrderAsc(stepId);

            for (com.elevenof.backoffice.model.CompetitionAssessment assessment : assessments) {
                for (int attempt = 1; attempt <= assessment.getAttemptsCount(); attempt++) {
                    String key = "score_" + assessment.getId() + "_" + attempt;
                    String val = allParams.get(key);
                    if (val != null && !val.isBlank()) {
                        try {
                            java.math.BigDecimal value = new java.math.BigDecimal(val.trim());
                            assessmentResultService.recordAttemptResult(assessment.getId(), participantId, attempt, value, null);
                        } catch (NumberFormatException ignored) {}
                    }
                }
                // Calculate final score for this assessment
                try { assessmentResultService.calculateAssessmentFinalScore(assessment.getId(), participantId); }
                catch (Exception ignored) {}
            }

            // Calculate step score
            try { assessmentResultService.calculateStepScore(stepId, participantId); }
            catch (Exception ignored) {}

            redirectAttributes.addFlashAttribute("success", "Đã lưu kết quả thành công!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Lỗi khi lưu: " + e.getMessage());
        }

        return "redirect:/admin/field-scoring?stageId=" + stageId + "&dayId=" + dayId + "&stepId=" + stepId + "&participantId=" + participantId;
    }
}
