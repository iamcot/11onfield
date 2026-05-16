package com.elevenof.backoffice.controller.api;

import com.elevenof.backoffice.dto.request.UpdateProfileRequest;
import com.elevenof.backoffice.dto.response.AddressResponse;
import com.elevenof.backoffice.dto.response.FeedItemDTO;
import com.elevenof.backoffice.dto.response.PlayerAttributeDTO;
import com.elevenof.backoffice.dto.response.PlayerListDTO;
import com.elevenof.backoffice.dto.response.PlayerProfileResponse;
import com.elevenof.backoffice.dto.response.ProvinceResponse;
import com.elevenof.backoffice.dto.response.UserListItemDTO;
import com.elevenof.backoffice.dto.response.UserProfileResponse;
import com.elevenof.backoffice.dto.response.UserResponse;
import com.elevenof.backoffice.exception.FileUploadException;
import com.elevenof.backoffice.exception.ResourceNotFoundException;
import com.elevenof.backoffice.model.Player;
import com.elevenof.backoffice.model.PlayerAchievement;
import com.elevenof.backoffice.model.PlayerAttribute;
import com.elevenof.backoffice.model.PlayerHighlight;
import com.elevenof.backoffice.model.PlayerSocial;
import com.elevenof.backoffice.model.User;
import com.elevenof.backoffice.repository.UserRepository;
import com.elevenof.backoffice.service.AddressService;
import com.elevenof.backoffice.service.BackgroundRemovalService;
import com.elevenof.backoffice.service.FeedService;
import com.elevenof.backoffice.service.FollowService;
import com.elevenof.backoffice.service.PlayerAttributeService;
import com.elevenof.backoffice.service.PlayerService;
import com.elevenof.backoffice.service.S3Service;
import com.elevenof.backoffice.specification.PlayerSpecification;
import com.elevenof.backoffice.util.PlatformDetector;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserRepository userRepository;
    private final PlayerService playerService;
    private final AddressService addressService;
    private final S3Service s3Service;
    private final FollowService followService;
    private final PlayerAttributeService playerAttributeService;
    private final BackgroundRemovalService backgroundRemovalService;
    private final FeedService feedService;
    private final jakarta.persistence.EntityManager entityManager;
    private final com.elevenof.backoffice.repository.AddressRepository addressRepository;

    /**
     * Helper method to get User from userid (String) in JWT token
     * JWT token stores userid (String like "606ed86c34a611f"), not id (Long)
     *
     * @param authentication JWT authentication containing userid
     * @return User entity
     */
    private User getUserFromAuthentication(Authentication authentication) {
        String userid = authentication.getName(); // This is userid (String), not id (Long)!
        return userRepository.findByUserid(userid)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        User user = getUserFromAuthentication(authentication);

        UserResponse response = UserResponse.builder()
            .id(user.getId())
            .phone(user.getPhone())
            .userid(user.getUserid())
            .fullName(user.getFullName())
            .email(user.getEmail())
            .avatar(user.getAvatar())
            .role(user.getRole().name())
            .createdAt(user.getCreatedAt())
            .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me/player")
    @PreAuthorize("hasRole('PLAYER')")
    public ResponseEntity<PlayerProfileResponse> getMyPlayerProfile(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        User user = getUserFromAuthentication(authentication);

        Player player = playerService.getPlayerProfile(user.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ cầu thủ"));

        PlayerProfileResponse response = PlayerProfileResponse.builder()
            .id(player.getId())
            .positions(player.getPositions() != null ? Arrays.asList(player.getPositions().split(",")) : null)
            .height(player.getHeight())
            .weight(player.getWeight())
            .preferredFoot(player.getPreferredFoot())
            .createdAt(player.getCreatedAt())
            .updatedAt(player.getUpdatedAt())
            .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{userid}")
    public ResponseEntity<UserProfileResponse> getUserByUserid(
            @PathVariable String userid,
            Authentication authentication
    ) {
        User user = userRepository.findByUserid(userid)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        // Check if user is enabled
        if (!user.getEnabled()) {
            throw new ResourceNotFoundException("Cầu thủ không tồn tại hoặc đã bị khoá");
        }

        // Determine if the current user is viewing their own profile
        boolean isOwner = false;
        if (authentication != null && authentication.isAuthenticated()) {
            User currentUser = getUserFromAuthentication(authentication);
            isOwner = currentUser.getId().equals(user.getId());
        }

        UserProfileResponse.UserProfileResponseBuilder responseBuilder = UserProfileResponse.builder()
            .id(user.getId())
            .phone(user.getPhone())
            .userid(user.getUserid())
            .fullName(user.getFullName())
            .email(user.getEmail())
            .role(user.getRole().name())
            .avatar(user.getAvatar())
            .dob(user.getDob())
            .gender(user.getGender() != null ? user.getGender().name() : null)
            .createdAt(user.getCreatedAt());

        // Add address if present
        if (user.getAddress() != null) {
            AddressResponse addressResponse = AddressResponse.builder()
                .id(user.getAddress().getId())
                .province(ProvinceResponse.builder()
                    .id(user.getAddress().getProvince().getId())
                    .name(user.getAddress().getProvince().getName())
                    .build())
                .address(user.getAddress().getAddress())
                .ward(user.getAddress().getWard())
                .build();
            responseBuilder.address(addressResponse);
        }

        // If user is a PLAYER, include player profile data
        if (user.getRole() == User.Role.PLAYER) {
            Optional<Player> playerOpt = playerService.getPlayerProfile(user.getId());
            final boolean finalIsOwner = isOwner;
            playerOpt.ifPresent(player -> {
                responseBuilder
                    .positions(player.getPositions() != null ? Arrays.asList(player.getPositions().split(",")) : null)
                    .secondaryPosition(player.getSecondaryPosition())
                    .yearsOfExperience(player.getYearsOfExperience())
                    .height(player.getHeight())
                    .weight(player.getWeight())
                    .preferredFoot(player.getPreferredFoot())
                    .level(player.getLevel() != null ? player.getLevel().name() : null)
                    .bio(player.getBio())
                    .personalId(player.getPersonalId())
                    .residentialAddress(user.getAddress() != null ? user.getAddress().getAddress() : null)
                    .school(player.getSchool())
                    .academy(player.getAcademy())
                    .club(player.getClub())
                    .verified(player.getVerified());

                // Load player attributes with left join (always 6 hexagon attributes)
                List<PlayerAttributeDTO> attributeDTOs = playerAttributeService.getHexagonAttributesWithValues(player.getId());
                responseBuilder.attributes(attributeDTOs);

                // Load achievements - filter by approval status based on viewer
                List<UserProfileResponse.AchievementDTO> individualAchs = player.getAchievements().stream()
                    .filter(a -> a.getType() == PlayerAchievement.AchievementType.INDIVIDUAL)
                    .filter(a -> finalIsOwner || a.getApprovalStatus() == PlayerAchievement.ApprovalStatus.APPROVED)
                    .map(a -> UserProfileResponse.AchievementDTO.builder()
                        .id(a.getId())
                        .title(a.getTitle())
                        .description(a.getDescription())
                        .date(a.getAchievementDate())
                        .approvalStatus(a.getApprovalStatus().name())
                        .build())
                    .toList();
                responseBuilder.individualAchievements(individualAchs);

                List<UserProfileResponse.AchievementDTO> teamAchs = player.getAchievements().stream()
                    .filter(a -> a.getType() == PlayerAchievement.AchievementType.TEAM)
                    .filter(a -> finalIsOwner || a.getApprovalStatus() == PlayerAchievement.ApprovalStatus.APPROVED)
                    .map(a -> UserProfileResponse.AchievementDTO.builder()
                        .id(a.getId())
                        .title(a.getTitle())
                        .description(a.getDescription())
                        .date(a.getAchievementDate())
                        .approvalStatus(a.getApprovalStatus().name())
                        .build())
                    .toList();
                responseBuilder.teamAchievements(teamAchs);

                List<UserProfileResponse.AchievementDTO> participantAchs = player.getAchievements().stream()
                    .filter(a -> a.getType() == PlayerAchievement.AchievementType.PARTICIPANT)
                    .filter(a -> finalIsOwner || a.getApprovalStatus() == PlayerAchievement.ApprovalStatus.APPROVED)
                    .map(a -> UserProfileResponse.AchievementDTO.builder()
                        .id(a.getId())
                        .title(a.getTitle())
                        .description(a.getDescription())
                        .date(a.getAchievementDate())
                        .approvalStatus(a.getApprovalStatus().name())
                        .build())
                    .toList();
                responseBuilder.participantAchievements(participantAchs);

                // Load highlights - filter by approval status based on viewer
                List<UserProfileResponse.HighlightDTO> highlights = player.getHighlights().stream()
                    .filter(h -> finalIsOwner || h.getApprovalStatus() == PlayerHighlight.ApprovalStatus.APPROVED)
                    .map(h -> UserProfileResponse.HighlightDTO.builder()
                        .id(h.getId())
                        .url(h.getUrl())
                        .platform(h.getPlatform())
                        .title(h.getTitle())
                        .date(h.getHighlightDate())
                        .approvalStatus(h.getApprovalStatus().name())
                        .build())
                    .toList();
                responseBuilder.highlights(highlights);

                // Load socials
                List<UserProfileResponse.SocialDTO> socials = player.getSocials().stream()
                    .map(s -> UserProfileResponse.SocialDTO.builder()
                        .id(s.getId())
                        .url(s.getUrl())
                        .platform(s.getPlatform())
                        .build())
                    .toList();
                responseBuilder.socials(socials);
            });
        }

        // Add follow counts for all users
        Long followersCount = followService.getFollowersCount(user.getId());
        Long followingCount = followService.getFollowingCount(user.getId());
        responseBuilder.followersCount(followersCount);
        responseBuilder.followingCount(followingCount);

        return ResponseEntity.ok(responseBuilder.build());
    }

    @PutMapping("/me")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<Void> updateProfile(
            Authentication authentication,
            @RequestBody UpdateProfileRequest request
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        User user = getUserFromAuthentication(authentication);

        System.out.println("=== UPDATE PROFILE REQUEST ===");
        System.out.println("User: " + user.getUserid());
        System.out.println("Personal ID: " + request.getPersonalId());
        System.out.println("School: " + request.getSchool());
        System.out.println("Academy: " + request.getAcademy());
        System.out.println("Club: " + request.getClub());
        System.out.println("Address: " + request.getAddress());
        System.out.println("Individual Achievements: " + (request.getIndividualAchievements() != null ? request.getIndividualAchievements().size() : "null"));
        System.out.println("Team Achievements: " + (request.getTeamAchievements() != null ? request.getTeamAchievements().size() : "null"));
        System.out.println("Highlights: " + (request.getHighlights() != null ? request.getHighlights().size() : "null"));
        System.out.println("Socials: " + (request.getSocials() != null ? request.getSocials().size() : "null"));
        System.out.println("===============================");

        // Update user fields
        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }
        if (request.getAvatar() != null) {
            user.setAvatar(request.getAvatar());
        }
        if (request.getDob() != null) {
            user.setDob(request.getDob());
        }
        if (request.getGender() != null) {
            try {
                user.setGender(User.Gender.valueOf(request.getGender()));
            } catch (IllegalArgumentException e) {
                // Ignore invalid gender value
            }
        }
        userRepository.save(user);

        // Update address if province is provided OR if residentialAddress is provided
        if (request.getProvinceId() != null) {
            addressService.updateOrCreateAddress(user, request.getProvinceId());
        }

        // Update residential address in user's address
        if (request.getResidentialAddress() != null) {
            if (user.getAddress() != null) {
                user.getAddress().setAddress(request.getResidentialAddress());
                addressRepository.save(user.getAddress());
            } else {
                // If user doesn't have an address record yet, skip
                System.out.println("Warning: Residential address provided but user has no address record. Skipping.");
            }
        }

        // If user is a PLAYER, update player profile
        if (user.getRole() == User.Role.PLAYER) {
            Optional<Player> playerOpt = playerService.getPlayerProfile(user.getId());
            Player player;

            if (playerOpt.isPresent()) {
                player = playerOpt.get();
            } else {
                // Create new player profile if it doesn't exist
                player = Player.builder()
                    .user(user)
                    .achievements(new ArrayList<>())
                    .highlights(new ArrayList<>())
                    .socials(new ArrayList<>())
                    .build();
            }

            if (request.getPositions() != null) {
                player.setPositions(String.join(",", request.getPositions()));
            }
            if (request.getSecondaryPosition() != null) {
                player.setSecondaryPosition(request.getSecondaryPosition());
            }
            if (request.getYearsOfExperience() != null) {
                player.setYearsOfExperience(request.getYearsOfExperience());
            }
            if (request.getHeight() != null) {
                player.setHeight(request.getHeight());
            }
            if (request.getWeight() != null) {
                player.setWeight(request.getWeight());
            }
            if (request.getPreferredFoot() != null) {
                player.setPreferredFoot(request.getPreferredFoot());
            }
            if (request.getLevel() != null) {
                player.setLevel(request.getLevel());
            }
            if (request.getBio() != null) {
                player.setBio(request.getBio());
            }

            // Update new extended fields
            if (request.getPersonalId() != null) {
                player.setPersonalId(request.getPersonalId());
            }
            if (request.getSchool() != null) {
                player.setSchool(request.getSchool());
            }
            if (request.getAcademy() != null) {
                player.setAcademy(request.getAcademy());
            }
            if (request.getClub() != null) {
                player.setClub(request.getClub());
            }

            // Update achievements - clear and recreate
            if (request.getIndividualAchievements() != null) {
                player.getAchievements().removeIf(a -> a.getType() == PlayerAchievement.AchievementType.INDIVIDUAL);
                entityManager.flush(); // Flush delete before insert
                for (UpdateProfileRequest.AchievementRequest achReq : request.getIndividualAchievements()) {
                    if (achReq.getTitle() != null && !achReq.getTitle().trim().isEmpty()) {
                        PlayerAchievement ach = PlayerAchievement.builder()
                            .player(player)
                            .type(PlayerAchievement.AchievementType.INDIVIDUAL)
                            .title(achReq.getTitle())
                            .description(achReq.getDescription())
                            .achievementDate(achReq.getDate())
                            .build();
                        player.getAchievements().add(ach);
                    }
                }
            }

            if (request.getTeamAchievements() != null) {
                player.getAchievements().removeIf(a -> a.getType() == PlayerAchievement.AchievementType.TEAM);
                entityManager.flush(); // Flush delete before insert
                for (UpdateProfileRequest.AchievementRequest achReq : request.getTeamAchievements()) {
                    if (achReq.getTitle() != null && !achReq.getTitle().trim().isEmpty()) {
                        PlayerAchievement ach = PlayerAchievement.builder()
                            .player(player)
                            .type(PlayerAchievement.AchievementType.TEAM)
                            .title(achReq.getTitle())
                            .description(achReq.getDescription())
                            .achievementDate(achReq.getDate())
                            .build();
                        player.getAchievements().add(ach);
                    }
                }
            }

            if (request.getParticipantAchievements() != null) {
                player.getAchievements().removeIf(a -> a.getType() == PlayerAchievement.AchievementType.PARTICIPANT);
                entityManager.flush(); // Flush delete before insert
                for (UpdateProfileRequest.AchievementRequest achReq : request.getParticipantAchievements()) {
                    if (achReq.getTitle() != null && !achReq.getTitle().trim().isEmpty()) {
                        PlayerAchievement ach = PlayerAchievement.builder()
                            .player(player)
                            .type(PlayerAchievement.AchievementType.PARTICIPANT)
                            .title(achReq.getTitle())
                            .description(achReq.getDescription())
                            .achievementDate(achReq.getDate())
                            .build();
                        player.getAchievements().add(ach);
                    }
                }
            }

            // Update highlights - clear and recreate
            if (request.getHighlights() != null) {
                player.getHighlights().clear();
                entityManager.flush(); // Flush delete before insert
                for (UpdateProfileRequest.HighlightRequest highlightReq : request.getHighlights()) {
                    if (highlightReq.getUrl() != null && !highlightReq.getUrl().trim().isEmpty()) {
                        PlayerHighlight highlight = PlayerHighlight.builder()
                            .player(player)
                            .url(highlightReq.getUrl())
                            .platform(PlatformDetector.detectPlatform(highlightReq.getUrl()))
                            .highlightDate(highlightReq.getDate())
                            .build();
                        player.getHighlights().add(highlight);
                    }
                }
            }

            // Update socials - clear and recreate
            if (request.getSocials() != null) {
                player.getSocials().clear();
                entityManager.flush(); // Flush delete before insert
                for (String url : request.getSocials()) {
                    if (url != null && !url.trim().isEmpty()) {
                        PlayerSocial social = PlayerSocial.builder()
                            .player(player)
                            .url(url)
                            .platform(PlatformDetector.detectPlatform(url))
                            .build();
                        player.getSocials().add(social);
                    }
                }
            }

            if (playerOpt.isPresent()) {
                playerService.updatePlayerProfile(player);
            } else {
                playerService.createPlayerProfile(user.getId(), player);
            }
        }

        return ResponseEntity.ok().build();
    }

    @PostMapping(value = "/me/avatar", consumes = "multipart/form-data")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<Map<String, String>> uploadAvatar(
            Authentication authentication,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "removeBackground", required = false, defaultValue = "false") boolean removeBackground
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        User user = getUserFromAuthentication(authentication);

        // Validate file
        if (file == null || file.isEmpty()) {
            throw new FileUploadException("File không được để trống");
        }

        if (!s3Service.isValidAvatarFile(file)) {
            throw new FileUploadException("File không hợp lệ. Chỉ chấp nhận: JPEG, PNG, GIF, WebP");
        }

        if (file.getSize() > 20 * 1024 * 1024) { // 20MB
            throw new FileUploadException("Kích thước file vượt quá 20MB");
        }

        try {
            log.info("=== UPLOAD AVATAR START === User ID: {}, File: {}, Size: {}",
                user.getId(), file.getOriginalFilename(), file.getSize());

            // Process background removal if requested
            MultipartFile processedFile = file;
            if (removeBackground) {
                try {
                    log.info("Background removal requested for user {}", user.getId());
                    byte[] processedBytes = backgroundRemovalService.removeBackgroundWithFallback(file.getBytes());

                    // Create new MultipartFile with processed image (PNG format from Lambda)
                    String originalFilename = file.getOriginalFilename();
                    String newFilename = originalFilename != null
                        ? originalFilename.replaceFirst("[.][^.]+$", ".png")
                        : "avatar.png";

                    processedFile = new ByteArrayMultipartFile(
                        processedBytes,
                        newFilename,
                        "image/png"
                    );
                    log.info("Background removal completed, new size: {} bytes", processedBytes.length);
                } catch (Exception e) {
                    log.warn("Background removal failed for user {}, using original image: {}", user.getId(), e.getMessage());
                    // Fallback to original file (already set)
                }
            }

            // Delete old avatar if exists
            if (user.getAvatar() != null && !user.getAvatar().isEmpty()) {
                log.info("Deleting old avatar: {}", user.getAvatar());
                s3Service.deleteAvatar(user.getAvatar());
            }

            // Upload new avatar (processed or original)
            log.info("Uploading new avatar to S3...");
            String avatarUrl = s3Service.uploadAvatar(processedFile, user.getId());
            log.info("S3 Upload successful. Avatar URL: {}", avatarUrl);

            // Update user avatar
            log.info("Saving avatar URL to database. Old avatar: {}, New avatar: {}", user.getAvatar(), avatarUrl);
            user.setAvatar(avatarUrl);
            User savedUser = userRepository.save(user);
            log.info("Database save successful. Saved avatar: {}", savedUser.getAvatar());

            // Return avatar URL
            Map<String, String> response = new HashMap<>();
            response.put("avatarUrl", avatarUrl);

            log.info("=== UPLOAD AVATAR SUCCESS === Avatar URL: {}", avatarUrl);
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            log.error("Failed to upload avatar for user {}", user.getId(), e);
            throw new FileUploadException("Upload thất bại: " + e.getMessage(), e);
        }
    }

    /**
     * Helper class to wrap byte array as MultipartFile
     */
    private static class ByteArrayMultipartFile implements MultipartFile {
        private final byte[] content;
        private final String filename;
        private final String contentType;

        public ByteArrayMultipartFile(byte[] content, String filename, String contentType) {
            this.content = content;
            this.filename = filename;
            this.contentType = contentType;
        }

        @Override
        public String getName() {
            return "file";
        }

        @Override
        public String getOriginalFilename() {
            return filename;
        }

        @Override
        public String getContentType() {
            return contentType;
        }

        @Override
        public boolean isEmpty() {
            return content == null || content.length == 0;
        }

        @Override
        public long getSize() {
            return content.length;
        }

        @Override
        public byte[] getBytes() {
            return content;
        }

        @Override
        public InputStream getInputStream() {
            return new ByteArrayInputStream(content);
        }

        @Override
        public void transferTo(File dest) throws IOException, IllegalStateException {
            throw new UnsupportedOperationException("transferTo not supported");
        }
    }

    /**
     * Get paginated list of players with optional filters and sorting
     *
     * @param page Page number (0-indexed)
     * @param size Page size
     * @param search Search string for player name
     * @param positions List of positions to filter by
     * @param provinceId Province ID to filter by
     * @param level Player level to filter by
     * @param preferredFoot Preferred foot to filter by
     * @param sortBy Field to sort by (e.g., "fullName", "height")
     * @param sortOrder Sort direction ("asc" or "desc")
     * @return Paginated list of players
     */
    @GetMapping("/players")
    public ResponseEntity<Page<PlayerListDTO>> getPlayers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) List<String> positions,
            @RequestParam(required = false) Long provinceId,
            @RequestParam(required = false) Player.PlayerLevel level,
            @RequestParam(required = false) String preferredFoot,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "asc") String sortOrder
    ) {
        // Build sort - handle player properties with join path
        Sort sort = Sort.unsorted();
        if (sortBy != null && !sortBy.isEmpty()) {
            String sortProperty = sortBy;

            // Map frontend sort fields to backend entity paths
            // Player properties need the "player." prefix for the join
            switch (sortBy) {
                case "height":
                case "weight":
                    sortProperty = "player." + sortBy;
                    break;
                case "fullName":
                case "dob":
                    // User properties - use as is
                    sortProperty = sortBy;
                    break;
                default:
                    sortProperty = sortBy;
            }

            // Special case for DOB: reverse the sort order
            // Because "Age ascending" means older people first (DOB descending)
            // and "Age descending" means younger people first (DOB ascending)
            boolean shouldReverse = "dob".equals(sortBy);
            String effectiveSortOrder = shouldReverse
                ? (sortOrder.equalsIgnoreCase("desc") ? "asc" : "desc")
                : sortOrder;

            sort = effectiveSortOrder.equalsIgnoreCase("desc")
                ? Sort.by(sortProperty).descending()
                : Sort.by(sortProperty).ascending();
        }

        Pageable pageable = PageRequest.of(page, size, sort);

        // Apply filters using Specification
        Specification<User> spec = PlayerSpecification.withFilters(
            search, positions, provinceId, level, preferredFoot
        );

        Page<User> users = userRepository.findAll(spec, pageable);

        // Map to PlayerListDTO
        Page<PlayerListDTO> playerList = users.map(user -> {
            Player player = user.getPlayer();

            // Calculate age
            Integer age = null;
            if (user.getDob() != null) {
                age = Period.between(user.getDob(), LocalDate.now()).getYears();
            }

            // Parse positions
            List<String> positionList = player.getPositions() != null
                ? Arrays.asList(player.getPositions().split(","))
                : List.of();

            // Get province name
            String provinceName = user.getAddress() != null && user.getAddress().getProvince() != null
                ? user.getAddress().getProvince().getName()
                : null;

            // Calculate real follower count
            long followerCount = followService.getFollowersCount(user.getId());

            // Load player attributes with left join (always 6 hexagon attributes)
            List<PlayerAttributeDTO> attributeDTOs = playerAttributeService.getHexagonAttributesWithValues(player.getId());

            return PlayerListDTO.builder()
                .id(user.getId())
                .userid(user.getUserid())
                .fullName(user.getFullName())
                .avatar(user.getAvatar())
                .age(age)
                .height(player.getHeight())
                .weight(player.getWeight())
                .positions(positionList)
                .preferredFoot(player.getPreferredFoot())
                .level(player.getLevel())
                .provinceName(provinceName)
                .academyId(player.getAcademyId())
                .followerCount((int) followerCount)
                .attributes(attributeDTOs)
                .build();
        });

        return ResponseEntity.ok(playerList);
    }

    // Follow endpoints
    @PostMapping("/{userid}/follow")
    public ResponseEntity<Void> followUser(
            @PathVariable String userid,
            Authentication authentication
    ) {
        User currentUser = getUserFromAuthentication(authentication);
        followService.followUser(currentUser.getId(), userid);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{userid}/follow")
    public ResponseEntity<Void> unfollowUser(
            @PathVariable String userid,
            Authentication authentication
    ) {
        User currentUser = getUserFromAuthentication(authentication);
        followService.unfollowUser(currentUser.getId(), userid);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{userid}/is-following")
    public ResponseEntity<Map<String, Boolean>> isFollowing(
            @PathVariable String userid,
            Authentication authentication
    ) {
        User currentUser = getUserFromAuthentication(authentication);
        boolean isFollowing = followService.isFollowing(currentUser.getId(), userid);
        return ResponseEntity.ok(Map.of("isFollowing", isFollowing));
    }

    @GetMapping("/{userid}/following")
    public ResponseEntity<List<UserListItemDTO>> getFollowingPlayers(
            @PathVariable String userid
    ) {
        User user = userRepository.findByUserid(userid)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userid));

        List<User> followedPlayers = followService.getFollowedPlayers(user.getId());

        // Filter out disabled/blocked users
        List<UserListItemDTO> response = followedPlayers.stream()
            .filter(player -> player.getEnabled()) // Only show enabled users
            .map(player -> UserListItemDTO.builder()
                .userid(player.getUserid())
                .fullName(player.getFullName())
                .avatar(player.getAvatar())
                .role(player.getRole().name())
                .build())
            .toList();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{userid}/followers")
    public ResponseEntity<List<UserListItemDTO>> getFollowers(
            @PathVariable String userid
    ) {
        User user = userRepository.findByUserid(userid)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userid));

        List<User> followers = followService.getFollowers(user.getId());

        // Filter out disabled/blocked users
        List<UserListItemDTO> response = followers.stream()
            .filter(follower -> follower.getEnabled()) // Only show enabled users
            .map(follower -> UserListItemDTO.builder()
                .userid(follower.getUserid())
                .fullName(follower.getFullName())
                .avatar(follower.getAvatar())
                .role(follower.getRole().name())
                .build())
            .toList();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{userid}/feeds")
    public ResponseEntity<List<FeedItemDTO>> getUserFeeds(
            @PathVariable String userid,
            Authentication authentication
    ) {
        // Determine if the current user is viewing their own profile
        boolean isOwner = false;
        if (authentication != null && authentication.isAuthenticated()) {
            User currentUser = getUserFromAuthentication(authentication);
            User targetUser = userRepository.findByUserid(userid)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            isOwner = currentUser.getId().equals(targetUser.getId());
        }

        List<FeedItemDTO> feeds = feedService.getUserFeeds(userid, isOwner);
        return ResponseEntity.ok(feeds);
    }
}

