package com.elevenof.backoffice.controller.admin;

import com.elevenof.backoffice.model.Address;
import com.elevenof.backoffice.model.Event;
import com.elevenof.backoffice.model.Player;
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

    @Value("${app.frontend.url}")
    private String frontendUrl;

    /**
     * Admin dashboard homepage
     */
    @GetMapping({"/", "/dashboard"})
    public String dashboard(Model model) {
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
            @RequestParam(required = false) String level
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));

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
            playerLevel != null) {

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

            // Preserve filter params
            model.addAttribute("search", search != null ? search : "");
            model.addAttribute("position", position != null ? position : "");
            model.addAttribute("provinceId", provinceId);
            model.addAttribute("level", level != null ? level : "");

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

    /**
     * Show player edit form
     */
    @GetMapping("/players/edit/{id}")
    public String editPlayer(@PathVariable Long id, Model model) {
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

        return "admin/player-edit";
    }

    /**
     * Save player updates
     */
    @PostMapping("/players/edit/{id}")
    @org.springframework.transaction.annotation.Transactional
    public String updatePlayer(
            @PathVariable Long id,
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

            // Update verified status
            existingPlayer.setVerified(verifiedStr != null && verifiedStr.equals("on"));

            // Update achievements - delete from DB first, then recreate
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

                        com.elevenof.backoffice.model.PlayerAchievement achievement =
                                com.elevenof.backoffice.model.PlayerAchievement.builder()
                                        .player(existingPlayer)
                                        .type(com.elevenof.backoffice.model.PlayerAchievement.AchievementType.INDIVIDUAL)
                                        .title(title.trim())
                                        .achievementDate(achievementDate)
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

                        com.elevenof.backoffice.model.PlayerAchievement achievement =
                                com.elevenof.backoffice.model.PlayerAchievement.builder()
                                        .player(existingPlayer)
                                        .type(com.elevenof.backoffice.model.PlayerAchievement.AchievementType.TEAM)
                                        .title(title.trim())
                                        .achievementDate(achievementDate)
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

                        com.elevenof.backoffice.model.PlayerAchievement achievement =
                                com.elevenof.backoffice.model.PlayerAchievement.builder()
                                        .player(existingPlayer)
                                        .type(com.elevenof.backoffice.model.PlayerAchievement.AchievementType.PARTICIPANT)
                                        .title(title.trim())
                                        .achievementDate(achievementDate)
                                        .build();
                        playerAchievementRepository.save(achievement);
                    }
                });
            }

            // Update highlights - delete from DB first, then recreate
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

                        com.elevenof.backoffice.model.PlayerHighlight highlight =
                                com.elevenof.backoffice.model.PlayerHighlight.builder()
                                        .player(existingPlayer)
                                        .url(url.trim())
                                        .platform(com.elevenof.backoffice.util.PlatformDetector.detectPlatform(url))
                                        .highlightDate(highlightDate)
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

        return "redirect:/admin/players";
    }

    /**
     * Soft delete player (set enabled = false)
     */
    @PostMapping("/players/delete/{id}")
    public String deletePlayer(@PathVariable Long id) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        User user = player.getUser();
        user.setEnabled(false);
        userRepository.save(user);

        return "redirect:/admin/players";
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

    // Player Verification Endpoints
    @PostMapping("/players/{playerId}/verify")
    @ResponseBody
    public Map<String, Object> verifyPlayer(@PathVariable Long playerId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        player.setVerified(true);
        playerRepository.save(player);

        return Map.of("success", true, "verified", true);
    }

    @PostMapping("/players/{playerId}/unverify")
    @ResponseBody
    public Map<String, Object> unverifyPlayer(@PathVariable Long playerId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        player.setVerified(false);
        playerRepository.save(player);

        return Map.of("success", true, "verified", false);
    }

    // Achievement Approval Endpoints
    @PostMapping("/achievements/{achievementId}/approve")
    @ResponseBody
    public Map<String, Object> approveAchievement(@PathVariable Long achievementId) {
        com.elevenof.backoffice.model.PlayerAchievement achievement =
                playerAchievementRepository.findById(achievementId)
                        .orElseThrow(() -> new RuntimeException("Achievement not found"));

        achievement.setApprovalStatus(com.elevenof.backoffice.model.PlayerAchievement.ApprovalStatus.APPROVED);
        playerAchievementRepository.save(achievement);

        return Map.of("success", true, "approvalStatus", "APPROVED");
    }

    @PostMapping("/achievements/{achievementId}/reject")
    @ResponseBody
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
    public Map<String, Object> approveHighlight(@PathVariable Long highlightId) {
        com.elevenof.backoffice.model.PlayerHighlight highlight =
                playerHighlightRepository.findById(highlightId)
                        .orElseThrow(() -> new RuntimeException("Highlight not found"));

        highlight.setApprovalStatus(com.elevenof.backoffice.model.PlayerHighlight.ApprovalStatus.APPROVED);
        playerHighlightRepository.save(highlight);

        return Map.of("success", true, "approvalStatus", "APPROVED");
    }

    @PostMapping("/highlights/{highlightId}/reject")
    @ResponseBody
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
}
