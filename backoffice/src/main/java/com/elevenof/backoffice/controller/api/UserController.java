package com.elevenof.backoffice.controller.api;

import com.elevenof.backoffice.dto.request.UpdateProfileRequest;
import com.elevenof.backoffice.dto.response.AddressResponse;
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
import com.elevenof.backoffice.model.PlayerAttribute;
import com.elevenof.backoffice.model.User;
import com.elevenof.backoffice.repository.UserRepository;
import com.elevenof.backoffice.service.AddressService;
import com.elevenof.backoffice.service.FollowService;
import com.elevenof.backoffice.service.PlayerAttributeService;
import com.elevenof.backoffice.service.PlayerService;
import com.elevenof.backoffice.service.S3Service;
import com.elevenof.backoffice.specification.PlayerSpecification;
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

import java.io.IOException;
import java.time.LocalDate;
import java.time.Period;
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
        User user = getUserFromAuthentication(authentication);

        UserResponse response = UserResponse.builder()
            .id(user.getId())
            .phone(user.getPhone())
            .userid(user.getUserid())
            .fullName(user.getFullName())
            .email(user.getEmail())
            .role(user.getRole().name())
            .createdAt(user.getCreatedAt())
            .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me/player")
    @PreAuthorize("hasRole('PLAYER')")
    public ResponseEntity<PlayerProfileResponse> getMyPlayerProfile(Authentication authentication) {
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
    public ResponseEntity<UserProfileResponse> getUserByUserid(@PathVariable String userid) {
        User user = userRepository.findByUserid(userid)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        // Check if user is enabled
        if (!user.getEnabled()) {
            throw new ResourceNotFoundException("Cầu thủ không tồn tại hoặc đã bị khoá");
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
            playerOpt.ifPresent(player -> {
                responseBuilder
                    .positions(player.getPositions() != null ? Arrays.asList(player.getPositions().split(",")) : null)
                    .height(player.getHeight())
                    .weight(player.getWeight())
                    .preferredFoot(player.getPreferredFoot())
                    .level(player.getLevel() != null ? player.getLevel().name() : null)
                    .bio(player.getBio());

                // Load player attributes with attribute type information
                List<PlayerAttribute> attributes = playerAttributeService.getPlayerAttributes(player.getId());
                List<PlayerAttributeDTO> attributeDTOs = attributes.stream()
                    .map(attr -> PlayerAttributeDTO.builder()
                        .attributeKey(attr.getAttributeType().getAttributeKey())
                        .attributeName(attr.getAttributeType().getAttributeName())
                        .attributeValue(attr.getAttributeValue())
                        .attributeGroup(attr.getAttributeType().getAttributeGroup())
                        .isHexagon(attr.getAttributeType().getIsHexagon())
                        .isGoalKeeper(attr.getAttributeType().getIsGoalKeeper())
                        .build())
                    .collect(Collectors.toList());
                responseBuilder.attributes(attributeDTOs);
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
    public ResponseEntity<Void> updateProfile(
            Authentication authentication,
            @RequestBody UpdateProfileRequest request
    ) {
        User user = getUserFromAuthentication(authentication);

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

        // Update address if province is provided
        if (request.getProvinceId() != null) {
            addressService.updateOrCreateAddress(user, request.getProvinceId());
        }

        // If user is a PLAYER, update player profile
        if (user.getRole() == User.Role.PLAYER) {
            Optional<Player> playerOpt = playerService.getPlayerProfile(user.getId());
            if (playerOpt.isPresent()) {
                Player player = playerOpt.get();

                if (request.getPositions() != null) {
                    player.setPositions(String.join(",", request.getPositions()));
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

                playerService.updatePlayerProfile(player);
            }
        }

        return ResponseEntity.ok().build();
    }

    @PostMapping(value = "/me/avatar", consumes = "multipart/form-data")
    public ResponseEntity<Map<String, String>> uploadAvatar(
            Authentication authentication,
            @RequestParam("file") MultipartFile file
    ) {
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
            // Delete old avatar if exists
            if (user.getAvatar() != null && !user.getAvatar().isEmpty()) {
                s3Service.deleteAvatar(user.getAvatar());
            }

            // Upload new avatar
            String avatarUrl = s3Service.uploadAvatar(file, user.getId());

            // Update user avatar
            user.setAvatar(avatarUrl);
            userRepository.save(user);

            // Return avatar URL
            Map<String, String> response = new HashMap<>();
            response.put("avatarUrl", avatarUrl);

            return ResponseEntity.ok(response);
        } catch (IOException e) {
            log.error("Failed to upload avatar for user {}", user.getId(), e);
            throw new FileUploadException("Upload thất bại: " + e.getMessage(), e);
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

            sort = sortOrder.equalsIgnoreCase("desc")
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

            // Load player attributes with attribute type information
            List<PlayerAttribute> attributes = playerAttributeService.getPlayerAttributes(player.getId());
            List<PlayerAttributeDTO> attributeDTOs = attributes.stream()
                .map(attr -> PlayerAttributeDTO.builder()
                    .attributeKey(attr.getAttributeType().getAttributeKey())
                    .attributeName(attr.getAttributeType().getAttributeName())
                    .attributeValue(attr.getAttributeValue())
                    .attributeGroup(attr.getAttributeType().getAttributeGroup())
                    .isHexagon(attr.getAttributeType().getIsHexagon())
                    .isGoalKeeper(attr.getAttributeType().getIsGoalKeeper())
                    .build())
                .collect(Collectors.toList());

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
}

