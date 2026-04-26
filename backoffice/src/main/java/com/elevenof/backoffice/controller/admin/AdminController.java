package com.elevenof.backoffice.controller.admin;

import com.elevenof.backoffice.model.Address;
import com.elevenof.backoffice.model.Event;
import com.elevenof.backoffice.model.Player;
import com.elevenof.backoffice.model.Province;
import com.elevenof.backoffice.model.User;
import com.elevenof.backoffice.repository.AddressRepository;
import com.elevenof.backoffice.repository.EventRepository;
import com.elevenof.backoffice.repository.PlayerRepository;
import com.elevenof.backoffice.repository.ProvinceRepository;
import com.elevenof.backoffice.repository.UserRepository;
import com.elevenof.backoffice.service.EventService;
import com.elevenof.backoffice.service.S3Service;
import com.elevenof.backoffice.specification.EventSpecification;
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

            // Load hexagon attribute types
            List<com.elevenof.backoffice.model.PlayerAttributeType> hexagonAttributes =
                playerAttributeTypeService.getHexagonAttributeTypes();

            // Load attributes for all players in current page
            Map<Long, Map<String, Integer>> playerAttributesMap = new java.util.HashMap<>();
            for (Player player : playerPage.getContent()) {
                Map<String, Integer> attrs = playerAttributeService.getPlayerAttributesAsMap(player.getId());
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
            model.addAttribute("hexagonAttributes", hexagonAttributes);
            model.addAttribute("playerAttributesMap", playerAttributesMap);

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
    public String updatePlayer(
            @PathVariable Long id,
            @RequestParam String fullName,
            @RequestParam String phone,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String avatar,
            @RequestParam(required = false) String dob,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) Long provinceId,
            @RequestParam(required = false) Integer height,
            @RequestParam(required = false) Integer weight,
            @RequestParam(required = false) String preferredFoot,
            @RequestParam(required = false) List<String> positions,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String bio
    ) {
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

            Address address = addressRepository.findByUserId(existingUser.getId())
                    .orElse(Address.builder()
                            .user(existingUser)
                            .build());

            address.setProvince(province);
            // ward and address detail remain null by default

            addressRepository.save(address);
        }

        // Update player fields
        existingPlayer.setHeight(height);
        existingPlayer.setWeight(weight);
        existingPlayer.setPreferredFoot(preferredFoot);

        // Convert List<String> positions to comma-separated string
        if (positions != null && !positions.isEmpty()) {
            existingPlayer.setPositions(String.join(",", positions));
        } else {
            existingPlayer.setPositions(null);
        }

        if (level != null && !level.isEmpty()) {
            existingPlayer.setLevel(Player.PlayerLevel.valueOf(level));
        }
        existingPlayer.setBio(bio);

        // Save
        userRepository.save(existingUser);
        playerRepository.save(existingPlayer);

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

    @GetMapping("/players/{playerId}/attributes")
    public String managePlayerAttributes(@PathVariable Long playerId, Model model) {
        Player player = playerRepository.findById(playerId)
            .orElseThrow(() -> new RuntimeException("Player not found"));

        List<com.elevenof.backoffice.model.PlayerAttributeType> allAttributeTypes =
            playerAttributeTypeService.getAllAttributeTypes();

        List<com.elevenof.backoffice.model.PlayerAttribute> playerAttributes =
            playerAttributeService.getPlayerAttributes(playerId);

        // Create a map of attribute type ID to current value
        Map<Long, Integer> attributeValues = new java.util.HashMap<>();
        playerAttributes.forEach(attr ->
            attributeValues.put(attr.getAttributeType().getId(), attr.getAttributeValue())
        );

        model.addAttribute("title", "Quản lý chỉ số cầu thủ");
        model.addAttribute("player", player);
        model.addAttribute("allAttributeTypes", allAttributeTypes);
        model.addAttribute("attributeValues", attributeValues);

        return "admin/player-attributes";
    }

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
}
