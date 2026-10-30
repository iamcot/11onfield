package com.elevenof.backoffice.controller.admin;

import com.elevenof.backoffice.dto.response.PlayerAttributeDTO;
import com.elevenof.backoffice.event.NotificationEvent;
import com.elevenof.backoffice.model.Address;
import com.elevenof.backoffice.model.Player;
import com.elevenof.backoffice.model.PlayerAchievement;
import com.elevenof.backoffice.model.PlayerAttribute;
import com.elevenof.backoffice.model.PlayerAttributeType;
import com.elevenof.backoffice.model.PlayerHighlight;
import com.elevenof.backoffice.model.PlayerSocial;
import com.elevenof.backoffice.model.Province;
import com.elevenof.backoffice.model.User;
import com.elevenof.backoffice.repository.AddressRepository;
import com.elevenof.backoffice.repository.PlayerAchievementRepository;
import com.elevenof.backoffice.repository.PlayerAttributeRepository;
import com.elevenof.backoffice.repository.PlayerHighlightRepository;
import com.elevenof.backoffice.repository.PlayerRepository;
import com.elevenof.backoffice.repository.PlayerSocialRepository;
import com.elevenof.backoffice.repository.ProvinceRepository;
import com.elevenof.backoffice.repository.UserRepository;
import com.elevenof.backoffice.service.PlayerAttributeService;
import com.elevenof.backoffice.service.PlayerAttributeTypeService;
import com.elevenof.backoffice.util.PlatformDetector;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Admin JSON API for players: list, profile, approvals and attributes (phase 2).
 * Viewing and approving content is open to EDITOR; changing profile data, verification,
 * lock state and attributes needs ADMIN or SUPER_USER.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminPlayerApiController {

    private static final String STAFF = "hasAnyRole('EDITOR', 'ADMIN', 'SUPER_USER')";
    private static final String MANAGER = "hasAnyRole('ADMIN', 'SUPER_USER')";

    private final PlayerRepository playerRepository;
    private final UserRepository userRepository;
    private final ProvinceRepository provinceRepository;
    private final AddressRepository addressRepository;
    private final PlayerAchievementRepository achievementRepository;
    private final PlayerHighlightRepository highlightRepository;
    private final PlayerSocialRepository socialRepository;
    private final PlayerAttributeRepository attributeRepository;
    private final PlayerAttributeService attributeService;
    private final PlayerAttributeTypeService attributeTypeService;
    private final ApplicationEventPublisher eventPublisher;
    private final com.elevenof.backoffice.repository.CompetitionParticipantRepository participantRepository;

    private static ResponseEntity<Map<String, Object>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("message", message));
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static LocalDate parseDate(String s) {
        try {
            return blankToNull(s) == null ? null : LocalDate.parse(s.trim());
        } catch (Exception e) {
            return null;
        }
    }

    // ==================== BADGES ====================

    /** Counts for the sidebar badges and the bell. */
    @GetMapping("/badges")
    @PreAuthorize(STAFF)
    public Map<String, Object> badges() {
        long pendingAchievements = achievementRepository.countByApprovalStatus(PlayerAchievement.ApprovalStatus.PENDING);
        long pendingHighlights = highlightRepository.countByApprovalStatus(PlayerHighlight.ApprovalStatus.PENDING);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("pendingAchievements", pendingAchievements);
        out.put("pendingHighlights", pendingHighlights);
        out.put("pendingApprovals", pendingAchievements + pendingHighlights);
        out.put("unverifiedPlayers", playerRepository.countByVerifiedFalseOrVerifiedIsNull());
        return out;
    }

    // ==================== LIST ====================

    @GetMapping("/players")
    @PreAuthorize(STAFF)
    @Transactional(readOnly = true)
    public Map<String, Object> players(@RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "20") int size,
                                       @RequestParam(required = false) String search,
                                       @RequestParam(required = false) String position,
                                       @RequestParam(required = false) Long provinceId,
                                       @RequestParam(required = false) String level,
                                       @RequestParam(required = false) Boolean verified,
                                       @RequestParam(required = false) Boolean hasPendingItems,
                                       @RequestParam(required = false) Long competitionId) {
        Player.PlayerLevel lv = null;
        if (level != null && !level.isEmpty()) {
            try { lv = Player.PlayerLevel.valueOf(level); } catch (IllegalArgumentException ignored) { }
        }
        final Player.PlayerLevel playerLevel = lv;

        Specification<Player> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            Join<Player, User> userJoin = root.join("user");
            if (search != null && !search.isBlank()) {
                String like = "%" + search.toLowerCase().trim() + "%";
                predicates.add(cb.or(cb.like(cb.lower(userJoin.get("fullName")), like), cb.like(cb.lower(userJoin.get("phone")), like)));
            }
            if (position != null && !position.isBlank()) predicates.add(cb.like(root.get("positions"), "%" + position + "%"));
            if (provinceId != null) {
                Join<User, Address> addressJoin = userJoin.join("address", JoinType.LEFT);
                predicates.add(cb.equal(addressJoin.get("province").get("id"), provinceId));
            }
            if (playerLevel != null) predicates.add(cb.equal(root.get("level"), playerLevel));
            if (verified != null) predicates.add(cb.equal(root.get("verified"), verified));
            if (Boolean.TRUE.equals(hasPendingItems)) {
                Subquery<Long> ach = query.subquery(Long.class);
                Root<PlayerAchievement> ar = ach.from(PlayerAchievement.class);
                ach.select(ar.get("player").get("id")).where(cb.and(
                        cb.equal(ar.get("player").get("id"), root.get("id")),
                        cb.equal(ar.get("approvalStatus"), PlayerAchievement.ApprovalStatus.PENDING)));
                Subquery<Long> hl = query.subquery(Long.class);
                Root<PlayerHighlight> hr = hl.from(PlayerHighlight.class);
                hl.select(hr.get("player").get("id")).where(cb.and(
                        cb.equal(hr.get("player").get("id"), root.get("id")),
                        cb.equal(hr.get("approvalStatus"), PlayerHighlight.ApprovalStatus.PENDING)));
                predicates.add(cb.or(cb.exists(ach), cb.exists(hl)));
            }
            if (competitionId != null) {
                Subquery<Long> cp = query.subquery(Long.class);
                Root<com.elevenof.backoffice.model.CompetitionParticipant> cr = cp.from(com.elevenof.backoffice.model.CompetitionParticipant.class);
                cp.select(cr.get("id")).where(cb.and(
                        cb.equal(cr.get("user").get("id"), userJoin.get("id")),
                        cb.equal(cr.get("competition").get("id"), competitionId)));
                predicates.add(cb.exists(cp));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        // Active accounts first, then newest, same order as the old admin
        Page<Player> p = playerRepository.findAll(spec,
                PageRequest.of(page, size, Sort.by(Sort.Order.desc("user.enabled"), Sort.Order.desc("createdAt"))));

        // Competitions each listed player has entered, fetched in one query for the page.
        Map<Long, List<Map<String, Object>>> comps = new HashMap<>();
        List<Long> userIds = p.getContent().stream().map(x -> x.getUser().getId()).toList();
        if (!userIds.isEmpty()) {
            for (com.elevenof.backoffice.model.CompetitionParticipant cp : participantRepository.findByUserIdInWithCompetition(userIds)) {
                comps.computeIfAbsent(cp.getUser().getId(), k -> new ArrayList<>()).add(Map.of(
                        "id", cp.getCompetition().getId(), "title", cp.getCompetition().getTitle(), "season", cp.getCompetition().getSeason()));
            }
        }

        List<Map<String, Object>> items = new ArrayList<>();
        for (Player pl : p.getContent()) {
            User u = pl.getUser();
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", pl.getId());
            m.put("userid", u.getUserid());
            m.put("fullName", u.getFullName());
            m.put("phone", u.getPhone());
            m.put("avatar", u.getAvatar());
            m.put("enabled", Boolean.TRUE.equals(u.getEnabled()));
            m.put("positions", pl.getPositions());
            m.put("level", pl.getLevel() != null ? pl.getLevel().name() : null);
            m.put("verified", Boolean.TRUE.equals(pl.getVerified()));
            m.put("provinceName", u.getAddress() != null && u.getAddress().getProvince() != null ? u.getAddress().getProvince().getName() : null);
            long pending = (pl.getAchievements() == null ? 0 : pl.getAchievements().stream().filter(a -> a.getApprovalStatus() == PlayerAchievement.ApprovalStatus.PENDING).count())
                    + (pl.getHighlights() == null ? 0 : pl.getHighlights().stream().filter(h -> h.getApprovalStatus() == PlayerHighlight.ApprovalStatus.PENDING).count());
            m.put("hasPending", pending > 0);
            m.put("pendingCount", pending);
            m.put("competitions", comps.getOrDefault(u.getId(), List.of()));
            boolean synthetic = attributeService.hasSyntheticAttributes(u.getId());
            boolean real = attributeService.hasRealAttributes(u.getId());
            m.put("attributeKind", synthetic ? "synthetic" : real ? "real" : "none");
            m.put("hexagon", attributeService.getHexagonAttributesWithValues(u.getId()).stream()
                    .filter(a -> a.getAttributeValue() != null)
                    .map(a -> Map.of("key", a.getAttributeKey(), "name", a.getAttributeName(), "value", a.getAttributeValue()))
                    .toList());
            items.add(m);
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("items", items);
        out.put("page", page);
        out.put("totalPages", p.getTotalPages());
        out.put("totalItems", p.getTotalElements());
        return out;
    }

    // ==================== DETAIL / UPDATE ====================

    private Map<String, Object> playerDetail(Player pl) {
        User u = pl.getUser();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", pl.getId());
        m.put("userid", u.getUserid());
        m.put("fullName", u.getFullName());
        m.put("phone", u.getPhone());
        m.put("email", u.getEmail());
        m.put("avatar", u.getAvatar());
        m.put("fullBodyPhoto", pl.getFullBodyPhoto());
        m.put("dob", u.getDob());
        m.put("gender", u.getGender() != null ? u.getGender().name() : null);
        m.put("enabled", Boolean.TRUE.equals(u.getEnabled()));
        m.put("provinceId", u.getAddress() != null && u.getAddress().getProvince() != null ? u.getAddress().getProvince().getId() : null);
        m.put("height", pl.getHeight());
        m.put("weight", pl.getWeight());
        m.put("preferredFoot", pl.getPreferredFoot());
        m.put("positions", pl.getPositions());
        m.put("secondaryPosition", pl.getSecondaryPosition());
        m.put("yearsOfExperience", pl.getYearsOfExperience());
        m.put("level", pl.getLevel() != null ? pl.getLevel().name() : null);
        m.put("bio", pl.getBio());
        m.put("personalId", pl.getPersonalId());
        m.put("address", pl.getAddress() != null ? pl.getAddress() : (u.getAddress() != null ? u.getAddress().getAddress() : null));
        m.put("school", pl.getSchool());
        m.put("academy", pl.getAcademy());
        m.put("club", pl.getClub());
        m.put("verified", Boolean.TRUE.equals(pl.getVerified()));
        m.put("achievements", achievementRepository.findByPlayerIdOrderByCreatedAtDesc(pl.getId()).stream().map(a -> {
            Map<String, Object> x = new LinkedHashMap<>();
            x.put("id", a.getId());
            x.put("type", a.getType().name());
            x.put("title", a.getTitle());
            x.put("date", a.getAchievementDate());
            x.put("status", a.getApprovalStatus().name());
            return x;
        }).toList());
        m.put("highlights", highlightRepository.findByPlayerIdOrderByCreatedAtDesc(pl.getId()).stream().map(h -> {
            Map<String, Object> x = new LinkedHashMap<>();
            x.put("id", h.getId());
            x.put("url", h.getUrl());
            x.put("platform", h.getPlatform());
            x.put("date", h.getHighlightDate());
            x.put("status", h.getApprovalStatus().name());
            return x;
        }).toList());
        m.put("socials", pl.getSocials() == null ? List.of() : pl.getSocials().stream().map(s -> Map.of("url", s.getUrl(), "platform", String.valueOf(s.getPlatform()))).toList());
        m.put("hasSyntheticAttributes", attributeService.hasSyntheticAttributes(u.getId()));
        m.put("hasRealAttributes", attributeService.hasRealAttributes(u.getId()));
        return m;
    }

    @GetMapping("/players/{id}")
    @PreAuthorize(STAFF)
    @Transactional(readOnly = true)
    public ResponseEntity<?> player(@PathVariable Long id) {
        return playerRepository.findById(id).<ResponseEntity<?>>map(pl -> ResponseEntity.ok(playerDetail(pl)))
                .orElseGet(() -> error(HttpStatus.NOT_FOUND, "Không tìm thấy cầu thủ"));
    }

    public record ItemDto(String type, String title, String url, String date) {}

    public record PlayerRequest(String fullName, String phone, String email, String avatar, String dob, String gender,
                                Long provinceId, Integer height, Integer weight, String preferredFoot, String positions,
                                String secondaryPosition, Integer yearsOfExperience, String level, String bio,
                                String personalId, String address, String school, String academy, String club,
                                Boolean verified, List<ItemDto> achievements, List<ItemDto> highlights, List<String> socials,
                                String fullBodyPhoto) {}

    @PutMapping("/players/{id}")
    @PreAuthorize(MANAGER)
    @Transactional
    public ResponseEntity<?> updatePlayer(@PathVariable Long id, @RequestBody PlayerRequest r) {
        Player pl = playerRepository.findById(id).orElse(null);
        if (pl == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy cầu thủ");
        User u = pl.getUser();
        try {
            u.setFullName(r.fullName());
            u.setPhone(r.phone());
            u.setEmail(blankToNull(r.email()));
            u.setAvatar(blankToNull(r.avatar()));
            if (parseDate(r.dob()) != null) u.setDob(parseDate(r.dob()));
            if (blankToNull(r.gender()) != null) u.setGender(User.Gender.valueOf(r.gender()));

            if (r.provinceId() != null) {
                Province province = provinceRepository.findById(r.provinceId()).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tỉnh/thành"));
                Address a = addressRepository.findByUserId(u.getId()).orElse(Address.builder().user(u).build());
                a.setProvince(province);
                addressRepository.save(a);
            }

            pl.setFullBodyPhoto(blankToNull(r.fullBodyPhoto()));
            pl.setHeight(r.height());
            pl.setWeight(r.weight());
            pl.setPreferredFoot(blankToNull(r.preferredFoot()));
            pl.setSecondaryPosition(blankToNull(r.secondaryPosition()));
            pl.setYearsOfExperience(r.yearsOfExperience());
            pl.setPositions(blankToNull(r.positions()));
            if (blankToNull(r.level()) != null) pl.setLevel(Player.PlayerLevel.valueOf(r.level()));
            pl.setBio(r.bio());
            pl.setPersonalId(blankToNull(r.personalId()));
            pl.setAddress(blankToNull(r.address()));
            pl.setSchool(blankToNull(r.school()));
            pl.setAcademy(blankToNull(r.academy()));
            pl.setClub(blankToNull(r.club()));

            boolean was = Boolean.TRUE.equals(pl.getVerified());
            boolean now = Boolean.TRUE.equals(r.verified());
            pl.setVerified(now);
            if (!was && now) notifyVerified(u);

            // Achievements and highlights are re-created, but an item the player already had keeps its approval status.
            Map<String, PlayerAchievement.ApprovalStatus> oldAch = new HashMap<>();
            for (PlayerAchievement a : achievementRepository.findByPlayerIdOrderByCreatedAtDesc(id)) {
                oldAch.put(a.getType() + ":" + a.getTitle().trim().toLowerCase(), a.getApprovalStatus());
            }
            Map<String, PlayerHighlight.ApprovalStatus> oldHl = new HashMap<>();
            for (PlayerHighlight h : highlightRepository.findByPlayerIdOrderByCreatedAtDesc(id)) {
                oldHl.put(h.getUrl().trim().toLowerCase(), h.getApprovalStatus());
            }
            achievementRepository.deleteByPlayerId(id);
            highlightRepository.deleteByPlayerId(id);
            socialRepository.deleteByPlayerId(id);

            if (r.achievements() != null) {
                for (ItemDto a : r.achievements()) {
                    if (blankToNull(a.title()) == null) continue;
                    PlayerAchievement.AchievementType type = PlayerAchievement.AchievementType.valueOf(a.type());
                    achievementRepository.save(PlayerAchievement.builder()
                            .player(pl).type(type).title(a.title().trim()).achievementDate(parseDate(a.date()))
                            .approvalStatus(oldAch.getOrDefault(type + ":" + a.title().trim().toLowerCase(), PlayerAchievement.ApprovalStatus.PENDING))
                            .build());
                }
            }
            if (r.highlights() != null) {
                for (ItemDto h : r.highlights()) {
                    if (blankToNull(h.url()) == null) continue;
                    highlightRepository.save(PlayerHighlight.builder()
                            .player(pl).url(h.url().trim()).platform(PlatformDetector.detectPlatform(h.url())).highlightDate(parseDate(h.date()))
                            .approvalStatus(oldHl.getOrDefault(h.url().trim().toLowerCase(), PlayerHighlight.ApprovalStatus.PENDING))
                            .build());
                }
            }
            if (r.socials() != null) {
                for (String url : r.socials()) {
                    if (blankToNull(url) == null) continue;
                    socialRepository.save(PlayerSocial.builder().player(pl).url(url.trim()).platform(PlatformDetector.detectPlatform(url)).build());
                }
            }
            userRepository.save(u);
            playerRepository.save(pl);
        } catch (IllegalArgumentException e) {
            return error(HttpStatus.BAD_REQUEST, e.getMessage());
        }
        return ResponseEntity.ok(Map.of("ok", true));
    }

    private void notifyVerified(User u) {
        try {
            eventPublisher.publishEvent(new NotificationEvent(this, u.getId(), "ACCOUNT_VERIFIED", Map.of("fullName", String.valueOf(u.getFullName())), null));
        } catch (Exception ignored) {
            // a failed notification must not block the update
        }
    }

    @PostMapping("/players/{id}/enabled")
    @PreAuthorize(MANAGER)
    public ResponseEntity<?> setEnabled(@PathVariable Long id, @RequestParam boolean enabled) {
        Player pl = playerRepository.findById(id).orElse(null);
        if (pl == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy cầu thủ");
        pl.getUser().setEnabled(enabled);
        userRepository.save(pl.getUser());
        return ResponseEntity.ok(Map.of("enabled", enabled));
    }

    @PostMapping("/players/{id}/verified")
    @PreAuthorize(MANAGER)
    public ResponseEntity<?> setVerified(@PathVariable Long id, @RequestParam boolean verified) {
        Player pl = playerRepository.findById(id).orElse(null);
        if (pl == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy cầu thủ");
        boolean was = Boolean.TRUE.equals(pl.getVerified());
        pl.setVerified(verified);
        playerRepository.save(pl);
        if (!was && verified) notifyVerified(pl.getUser());
        return ResponseEntity.ok(Map.of("verified", verified));
    }

    // ==================== APPROVALS ====================

    @GetMapping("/approvals")
    @PreAuthorize(STAFF)
    @Transactional(readOnly = true)
    public Map<String, Object> approvals() {
        List<Map<String, Object>> ach = achievementRepository.findByApprovalStatusOrderByCreatedAtDesc(PlayerAchievement.ApprovalStatus.PENDING).stream().map(a -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", a.getId());
            m.put("playerId", a.getPlayer().getId());
            m.put("playerName", a.getPlayer().getUser().getFullName());
            m.put("type", a.getType().name());
            m.put("title", a.getTitle());
            m.put("date", a.getAchievementDate());
            return m;
        }).toList();
        List<Map<String, Object>> hl = highlightRepository.findByApprovalStatusOrderByCreatedAtDesc(PlayerHighlight.ApprovalStatus.PENDING).stream().map(h -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", h.getId());
            m.put("playerId", h.getPlayer().getId());
            m.put("playerName", h.getPlayer().getUser().getFullName());
            m.put("url", h.getUrl());
            m.put("platform", h.getPlatform());
            m.put("date", h.getHighlightDate());
            return m;
        }).toList();
        return Map.of("achievements", ach, "highlights", hl);
    }

    @PostMapping("/achievements/{id}/{decision}")
    @PreAuthorize(STAFF)
    @Transactional
    public ResponseEntity<?> decideAchievement(@PathVariable Long id, @PathVariable String decision) {
        PlayerAchievement a = achievementRepository.findById(id).orElse(null);
        if (a == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy thành tích");
        boolean approve = "approve".equals(decision);
        if (!approve && !"reject".equals(decision)) return error(HttpStatus.BAD_REQUEST, "Thao tác không hợp lệ");
        a.setApprovalStatus(approve ? PlayerAchievement.ApprovalStatus.APPROVED : PlayerAchievement.ApprovalStatus.REJECTED);
        achievementRepository.save(a);
        if (approve) {
            User u = a.getPlayer().getUser();
            eventPublisher.publishEvent(new NotificationEvent(this, u.getId(), "ACHIEVEMENT_APPROVED",
                    Map.of("fullName", String.valueOf(u.getFullName()), "achievementTitle", a.getTitle()),
                    String.format("{\"achievementId\": %d}", a.getId())));
        }
        return ResponseEntity.ok(Map.of("status", a.getApprovalStatus().name()));
    }

    @PostMapping("/highlights/{id}/{decision}")
    @PreAuthorize(STAFF)
    @Transactional
    public ResponseEntity<?> decideHighlight(@PathVariable Long id, @PathVariable String decision) {
        PlayerHighlight h = highlightRepository.findById(id).orElse(null);
        if (h == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy highlight");
        boolean approve = "approve".equals(decision);
        if (!approve && !"reject".equals(decision)) return error(HttpStatus.BAD_REQUEST, "Thao tác không hợp lệ");
        h.setApprovalStatus(approve ? PlayerHighlight.ApprovalStatus.APPROVED : PlayerHighlight.ApprovalStatus.REJECTED);
        highlightRepository.save(h);
        if (approve) {
            User u = h.getPlayer().getUser();
            eventPublisher.publishEvent(new NotificationEvent(this, u.getId(), "HIGHLIGHT_APPROVED",
                    Map.of("fullName", String.valueOf(u.getFullName()), "highlightDescription", h.getTitle() != null ? h.getTitle() : "Video highlight"),
                    String.format("{\"highlightId\": %d}", h.getId())));
        }
        return ResponseEntity.ok(Map.of("status", h.getApprovalStatus().name()));
    }

    // ==================== PLAYER ATTRIBUTES ====================

    private List<Map<String, Object>> attrRows(Long playerId, boolean synthetic) {
        return attributeRepository.findByPlayerIdAndIsSynthetic(playerId, synthetic).stream().map(pa -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("typeId", pa.getAttributeType().getId());
            m.put("key", pa.getAttributeType().getAttributeKey());
            m.put("name", pa.getAttributeType().getAttributeName());
            m.put("group", pa.getAttributeType().getAttributeGroup());
            m.put("value", pa.getAttributeValue());
            if (synthetic) m.put("generatedAt", pa.getGenerationTimestamp());
            return m;
        }).toList();
    }

    @GetMapping("/players/{id}/attributes")
    @PreAuthorize(STAFF)
    @Transactional(readOnly = true)
    public ResponseEntity<?> playerAttributes(@PathVariable Long id) {
        Player pl = playerRepository.findById(id).orElse(null);
        if (pl == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy cầu thủ");
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("playerId", id);
        m.put("fullName", pl.getUser().getFullName());
        m.put("hasSynthetic", attributeService.hasSyntheticAttributes(id));
        m.put("hasReal", attributeService.hasRealAttributes(id));
        m.put("generationTimestamp", attributeService.getGenerationTimestamp(id));
        m.put("real", attrRows(id, false));
        m.put("synthetic", attrRows(id, true));
        m.put("types", attributeTypeService.getAllAttributeTypes().stream().map(this::typeJson).toList());
        return ResponseEntity.ok(m);
    }

    public record AttributeValues(Map<Long, Integer> values) {}

    @PutMapping("/players/{id}/attributes")
    @PreAuthorize(MANAGER)
    public ResponseEntity<?> saveAttributes(@PathVariable Long id, @RequestBody AttributeValues body, Authentication auth) {
        if (body.values() == null || body.values().isEmpty()) return error(HttpStatus.BAD_REQUEST, "Chưa có giá trị nào");
        for (Integer v : body.values().values()) {
            if (v == null || v < 0 || v > 100) return error(HttpStatus.BAD_REQUEST, "Chỉ số phải từ 0 đến 100");
        }
        attributeService.bulkUpdatePlayerAttributes(id, body.values(), auth.getName());
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping("/players/{id}/attributes/generate")
    @PreAuthorize(MANAGER)
    public ResponseEntity<?> generate(@PathVariable Long id, Authentication auth) {
        try {
            attributeService.generateAndSaveSyntheticAttributes(id, auth.getName());
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (Exception e) {
            return error(HttpStatus.BAD_REQUEST, "Lỗi khi tạo chỉ số giả lập: " + e.getMessage());
        }
    }

    @PostMapping("/players/{id}/attributes/switch-to-synthetic")
    @PreAuthorize(MANAGER)
    public ResponseEntity<?> toSynthetic(@PathVariable Long id, Authentication auth) {
        try {
            attributeService.switchToSyntheticAttributes(id, auth.getName());
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (Exception e) {
            return error(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PostMapping("/players/{id}/attributes/switch-to-real")
    @PreAuthorize(MANAGER)
    public ResponseEntity<?> toReal(@PathVariable Long id) {
        try {
            attributeService.switchToRealAttributes(id);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (Exception e) {
            return error(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PostMapping("/players/bulk-generate-attributes")
    @PreAuthorize(MANAGER)
    public ResponseEntity<?> bulkGenerate(Authentication auth) {
        List<Long> userIds = playerRepository.findAll().stream()
                .filter(p -> attributeService.getPlayerAttributes(p.getId()).isEmpty())
                .map(p -> p.getUser().getId())
                .collect(Collectors.toList());
        if (!userIds.isEmpty()) attributeService.bulkGenerateSyntheticAttributes(userIds, auth.getName());
        return ResponseEntity.ok(Map.of("count", userIds.size()));
    }

    // ==================== ATTRIBUTE TYPES ====================

    private Map<String, Object> typeJson(PlayerAttributeType t) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", t.getId());
        m.put("attributeKey", t.getAttributeKey());
        m.put("attributeName", t.getAttributeName());
        m.put("isHexagon", Boolean.TRUE.equals(t.getIsHexagon()));
        m.put("isGoalKeeper", Boolean.TRUE.equals(t.getIsGoalKeeper()));
        m.put("attributeGroup", t.getAttributeGroup());
        return m;
    }

    public record TypeRequest(String attributeKey, String attributeName, Boolean isHexagon, Boolean isGoalKeeper, String attributeGroup) {}

    private PlayerAttributeType toType(TypeRequest r) {
        return PlayerAttributeType.builder()
                .attributeKey(r.attributeKey())
                .attributeName(r.attributeName())
                .isHexagon(Boolean.TRUE.equals(r.isHexagon()))
                .isGoalKeeper(Boolean.TRUE.equals(r.isGoalKeeper()))
                .attributeGroup(blankToNull(r.attributeGroup()))
                .build();
    }

    @GetMapping("/attribute-types")
    @PreAuthorize(MANAGER)
    public List<Map<String, Object>> attributeTypes() {
        return attributeTypeService.getAllAttributeTypes().stream().map(this::typeJson).toList();
    }

    @PostMapping("/attribute-types")
    @PreAuthorize(MANAGER)
    public ResponseEntity<?> createType(@RequestBody TypeRequest r, Authentication auth) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(typeJson(attributeTypeService.createAttributeType(toType(r), auth.getName())));
        } catch (Exception e) {
            return error(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PutMapping("/attribute-types/{id}")
    @PreAuthorize(MANAGER)
    public ResponseEntity<?> updateType(@PathVariable Long id, @RequestBody TypeRequest r, Authentication auth) {
        try {
            return ResponseEntity.ok(typeJson(attributeTypeService.updateAttributeType(id, toType(r), auth.getName())));
        } catch (Exception e) {
            return error(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @DeleteMapping("/attribute-types/{id}")
    @PreAuthorize(MANAGER)
    public ResponseEntity<?> deleteType(@PathVariable Long id) {
        try {
            attributeTypeService.deleteAttributeType(id);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (Exception e) {
            return error(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }
}
