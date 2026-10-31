package com.elevenof.backoffice.controller.api;

import com.elevenof.backoffice.dto.response.*;
import com.elevenof.backoffice.model.*;
import com.elevenof.backoffice.repository.CompetitionNewsRepository;
import com.elevenof.backoffice.repository.CompetitionSponsorRepository;
import com.elevenof.backoffice.repository.CompetitionStageRepository;
import com.elevenof.backoffice.service.CompetitionService;
import com.elevenof.backoffice.service.StageResultService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/competitions")
@RequiredArgsConstructor
@Slf4j
public class CompetitionController {

    private final CompetitionService competitionService;
    private final StageResultService stageResultService;
    private final CompetitionStageRepository stageRepository;
    private final CompetitionNewsRepository newsRepository;
    private final CompetitionSponsorRepository sponsorRepository;
    private final com.elevenof.backoffice.service.StageCheckinService checkinService;
    private final com.elevenof.backoffice.repository.UserRepository userRepository;
    private final com.elevenof.backoffice.service.Top30Service top30Service;

    /** JwtAuthenticationFilter stores the userid (String) as the principal, not the User entity. */
    private User currentUser(Authentication authentication) {
        if (authentication == null) return null;
        Object principal = authentication.getPrincipal();
        if (principal instanceof User u) return u;
        return principal instanceof String userid ? userRepository.findByUserid(userid).orElse(null) : null;
    }

    /**
     * Get current active competition
     */
    @GetMapping("/current")
    public ResponseEntity<CompetitionDetailDTO> getCurrentCompetition() {
        return competitionService.getCurrentCompetition()
            .map(this::mapToDetailDTO)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get competition by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<CompetitionDetailDTO> getCompetitionById(@PathVariable Long id) {
        return competitionService.getCompetitionById(id)
            .map(this::mapToDetailDTO)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /** A logged-in player scanned the QR shown at a stage (see StageCheckinService). */
    @PostMapping("/checkin")
    public ResponseEntity<?> checkin(@RequestBody Map<String, String> body, Authentication authentication) {
        User user = currentUser(authentication);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Vui lòng đăng nhập để check-in."));
        }
        try {
            return ResponseEntity.ok(checkinService.checkIn(user.getId(), body.get("code")));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Check if user is registered for competition
     */
    @GetMapping("/{id}/is-registered")
    public ResponseEntity<ParticipantStatusDTO> checkRegistration(
            @PathVariable Long id,
            Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.ok(ParticipantStatusDTO.builder()
                .isRegistered(false)
                .build());
        }

        User user = currentUser(authentication);
        if (user == null) return ResponseEntity.status(401).build();
        return competitionService.getParticipant(user.getId(), id)
            .map(participant -> ResponseEntity.ok(ParticipantStatusDTO.builder()
                .isRegistered(true)
                .status(participant.getStatus().name())
                .selectedRegion(participant.getSelectedRegion() != null ?
                    participant.getSelectedRegion().name() : null)
                .build()))
            .orElse(ResponseEntity.ok(ParticipantStatusDTO.builder()
                .isRegistered(false)
                .build()));
    }

    /**
     * Register for competition (manual registration)
     */
    @PostMapping("/{id}/register")
    public ResponseEntity<String> registerForCompetition(
            @PathVariable Long id,
            Authentication authentication) {
        User user = currentUser(authentication);
        if (user == null) return ResponseEntity.status(401).build();

        try {
            competitionService.registerForCompetition(user.getId(), id, user);
            return ResponseEntity.ok("Đăng ký thành công");
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Withdraw from competition
     */
    @DeleteMapping("/{id}/register")
    public ResponseEntity<String> withdrawFromCompetition(
            @PathVariable Long id,
            Authentication authentication) {
        User user = currentUser(authentication);
        if (user == null) return ResponseEntity.status(401).build();

        try {
            competitionService.withdrawFromCompetition(user.getId(), id);
            return ResponseEntity.ok("Rút khỏi cuộc thi thành công");
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Get competition stages
     */
    @GetMapping("/{id}/stages")
    public ResponseEntity<List<StageDTO>> getStages(@PathVariable Long id) {
        List<CompetitionStage> stages = stageRepository.findByCompetitionIdOrderByStageNumberAsc(id);

        List<StageDTO> stageDTOs = stages.stream()
            .map(stage -> StageDTO.builder()
                .id(stage.getId())
                .stageNumber(stage.getStageNumber())
                .title(stage.getTitle())
                .description(stage.getDescription())
                .stageDate(stage.getStageDate())
                .stageTime(stage.getStageTime())
                .stageType(stage.getStageType().name())
                .region(stage.getRegion() != null ? stage.getRegion().name() : null)
                .status(stage.getStatus().name())
                .isPublicScoring(stage.getIsPublicScoring())
                .build())
            .collect(Collectors.toList());

        return ResponseEntity.ok(stageDTOs);
    }

    /**
     * The selected Top 30, once the list is finalized. Sorted by position then name; a rank or a score never goes
     * out here, because the hand-picked list differs from the score order.
     */
    @GetMapping("/{id}/top30")
    public ResponseEntity<Top30DTO> getTop30(@PathVariable Long id) {
        return ResponseEntity.ok(top30Service.get(id));
    }

    /**
     * Get user's own results (includes internal training scores)
     */
    @GetMapping("/{id}/my-results")
    public ResponseEntity<List<StageResultDTO>> getMyResults(
            @PathVariable Long id,
            Authentication authentication) {
        User user = currentUser(authentication);
        if (user == null) return ResponseEntity.status(401).build();

        return competitionService.getParticipant(user.getId(), id)
            .map(participant -> {
                List<StageResult> results = stageResultService.getMyResults(participant.getId());

                List<StageResultDTO> dtos = results.stream()
                    .map(result -> StageResultDTO.builder()
                        .id(result.getId())
                        .stageId(result.getStage().getId())
                        .stageTitle(result.getStage().getTitle())
                        .stageNumber(result.getStage().getStageNumber())
                        .userId(user.getId())
                        .fullName(user.getFullName())
                        .avatar(user.getAvatar())
                        .score(result.getScore())
                        .performanceNotes(result.getPerformanceNotes())
                        .videoUrl(result.getVideoUrl())
                        .isPublic(result.getIsPublic())
                        .build())
                    .collect(Collectors.toList());

                return ResponseEntity.ok(dtos);
            })
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get published news for competition
     */
    @GetMapping("/{id}/news")
    public ResponseEntity<List<CompetitionNewsDTO>> getNews(@PathVariable Long id) {
        List<CompetitionNews> news = newsRepository
            .findPublishedWithAuthor(id, NewsStatus.PUBLISHED);

        List<CompetitionNewsDTO> dtos = news.stream()
            .map(article -> CompetitionNewsDTO.builder()
                .id(article.getId())
                .title(article.getTitle())
                .shortContent(article.getShortContent())
                .content(article.getContent())
                .thumbnail(article.getThumbnail())
                .authorByline(article.getAuthorByline())
                .authorName(article.getAuthorByline() != null && !article.getAuthorByline().isEmpty()
                    ? article.getAuthorByline()
                    : article.getAuthor() != null ? article.getAuthor().getFullName() : null)
                .publishedAt(article.getPublishedAt())
                .isFeatured(article.getIsFeatured())
                .build())
            .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    /**
     * Get active sponsors for competition
     */
    @GetMapping("/{id}/sponsors")
    public ResponseEntity<List<CompetitionSponsorDTO>> getSponsors(@PathVariable Long id) {
        List<CompetitionSponsor> sponsors = sponsorRepository
            .findByCompetitionIdAndIsActiveTrueOrderByDisplayOrderAsc(id);

        List<CompetitionSponsorDTO> dtos = sponsors.stream()
            .map(sponsor -> CompetitionSponsorDTO.builder()
                .id(sponsor.getId())
                .name(sponsor.getName())
                .logoUrl(sponsor.getLogoUrl())
                .websiteUrl(sponsor.getWebsiteUrl())
                .displayOrder(sponsor.getDisplayOrder())
                .adPosition(sponsor.getAdPosition())
                .bannerImageUrl(sponsor.getBannerImageUrl())
                .isActive(sponsor.getIsActive())
                .build())
            .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    // Helper method to map Competition to DetailDTO
    private CompetitionDetailDTO mapToDetailDTO(Competition competition) {
        List<CompetitionStage> stages = stageRepository
            .findByCompetitionIdOrderByStageNumberAsc(competition.getId());

        // same rule as the competition's player list (/users/players?competitionId=)
        long participantCount = userRepository.count(
            com.elevenof.backoffice.specification.PlayerSpecification.registeredIn(competition.getId()));

        List<StageDTO> stageDTOs = stages.stream()
            .map(stage -> StageDTO.builder()
                .id(stage.getId())
                .stageNumber(stage.getStageNumber())
                .title(stage.getTitle())
                .description(stage.getDescription())
                .stageDate(stage.getStageDate())
                .stageTime(stage.getStageTime())
                .stageType(stage.getStageType().name())
                .region(stage.getRegion() != null ? stage.getRegion().name() : null)
                .status(stage.getStatus().name())
                .isPublicScoring(stage.getIsPublicScoring())
                .build())
            .collect(Collectors.toList());

        return CompetitionDetailDTO.builder()
            .id(competition.getId())
            .season(competition.getSeason())
            .title(competition.getTitle())
            .description(competition.getDescription())
            .picture(competition.getPicture())
            .status(competition.getStatus().name())
            .currentPhase(competition.getCurrentPhase())
            .registrationStartDate(competition.getRegistrationStartDate())
            .registrationEndDate(competition.getRegistrationEndDate())
            .competitionStartDate(competition.getCompetitionStartDate())
            .competitionEndDate(competition.getCompetitionEndDate())
            .participantCount(participantCount)
            .stages(stageDTOs)
            .build();
    }
}
