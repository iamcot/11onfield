package com.elevenof.backoffice.controller.admin;

import com.elevenof.backoffice.model.NotificationScenario;
import com.elevenof.backoffice.model.NotificationTemplate;
import com.elevenof.backoffice.model.User;
import com.elevenof.backoffice.repository.NotificationScenarioRepository;
import com.elevenof.backoffice.repository.UserRepository;
import com.elevenof.backoffice.service.AuthenticationService;
import com.elevenof.backoffice.service.NotificationTemplateService;
import com.elevenof.backoffice.service.ZnsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.util.*;

/** JSON API behind the Next.js admin for notifications, Zalo ZNS status and staff accounts. */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminSystemApiController {

    private static final String MANAGER = "hasRole('ADMIN')";
    private static final String SUPER = "hasRole('ADMIN')";
    /** Admin site and scouting accounts, listed by default. */
    private static final List<User.Role> STAFF_ROLES = List.of(User.Role.ADMIN, User.Role.EDITOR, User.Role.MEDICAL, User.Role.COACH, User.Role.SCOUTER);
    /** Players have their own pages, so this screen never lists them. */
    private static final List<User.Role> NOT_PLAYERS = java.util.Arrays.stream(User.Role.values()).filter(r -> r != User.Role.PLAYER).toList();

    private final NotificationScenarioRepository scenarioRepository;
    private final NotificationTemplateService templateService;
    private final ZnsService znsService;
    private final UserRepository userRepository;
    private final AuthenticationService authenticationService;
    private final PasswordEncoder passwordEncoder;

    // ==================== NOTIFICATIONS ====================

    @GetMapping("/notifications/scenarios")
    @PreAuthorize(MANAGER)
    public List<Map<String, Object>> scenarios() {
        List<Map<String, Object>> out = new ArrayList<>();
        for (NotificationScenario s : scenarioRepository.findAll()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", s.getId());
            m.put("scenarioKey", s.getScenarioKey());
            m.put("name", s.getName());
            m.put("description", s.getDescription());
            m.put("emailEnabled", Boolean.TRUE.equals(s.getEmailEnabled()));
            m.put("inappEnabled", Boolean.TRUE.equals(s.getInappEnabled()));
            m.put("znsEnabled", Boolean.TRUE.equals(s.getZnsEnabled()));
            out.add(m);
        }
        return out;
    }

    @PutMapping("/notifications/scenarios/{id}")
    @PreAuthorize(MANAGER)
    public ResponseEntity<?> updateScenario(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        NotificationScenario s = scenarioRepository.findById(id).orElse(null);
        if (s == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy kịch bản");
        if (body.get("emailEnabled") instanceof Boolean b) s.setEmailEnabled(b);
        if (body.get("inappEnabled") instanceof Boolean b) s.setInappEnabled(b);
        if (body.get("znsEnabled") instanceof Boolean b) s.setZnsEnabled(b);
        scenarioRepository.save(s);
        return ResponseEntity.ok(Map.of("message", "Đã cập nhật"));
    }

    @GetMapping("/notifications/scenarios/{id}/templates")
    @PreAuthorize(MANAGER)
    public ResponseEntity<?> templates(@PathVariable Long id) {
        NotificationScenario s = scenarioRepository.findById(id).orElse(null);
        if (s == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy kịch bản");
        List<Map<String, Object>> items = new ArrayList<>();
        for (NotificationTemplate t : templateService.getTemplatesByScenario(id)) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", t.getId());
            m.put("channel", t.getChannel() != null ? t.getChannel().name() : null);
            m.put("subject", t.getSubject());
            m.put("bodyTemplate", t.getBodyTemplate());
            m.put("variables", t.getVariables());
            m.put("active", Boolean.TRUE.equals(t.getActive()));
            items.add(m);
        }
        return ResponseEntity.ok(Map.of("scenario", Map.of("id", s.getId(), "name", s.getName()), "templates", items));
    }

    @PutMapping("/notifications/templates/{id}")
    @PreAuthorize(MANAGER)
    public ResponseEntity<?> updateTemplate(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        NotificationTemplate t = templateService.getTemplateById(id).orElse(null);
        if (t == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy template");
        String subject = body.get("subject") == null ? "" : body.get("subject").toString();
        String text = body.get("bodyTemplate") == null ? "" : body.get("bodyTemplate").toString();
        if (text.isBlank()) return error(HttpStatus.BAD_REQUEST, "Nội dung template không được để trống");
        t.setSubject(subject);
        t.setBodyTemplate(text);
        if (body.get("active") instanceof Boolean b) t.setActive(b);
        templateService.saveTemplate(t);
        return ResponseEntity.ok(Map.of("message", "Đã lưu template"));
    }

    // ==================== ZALO ZNS ====================

    /** Token status only; (re)authorisation stays on /admin/zns/authorize because Zalo redirects back to a registered URL. */
    @GetMapping("/zns")
    @PreAuthorize(MANAGER)
    public ResponseEntity<?> zns() {
        try {
            return ResponseEntity.ok(znsService.getTokenInfo());
        } catch (Exception e) {
            return error(HttpStatus.INTERNAL_SERVER_ERROR, "Không đọc được thông tin token");
        }
    }

    // ==================== STAFF ACCOUNTS ====================

    @GetMapping("/users")
    @PreAuthorize(SUPER)
    public Map<String, Object> users(@RequestParam(defaultValue = "0") int page,
                                     @RequestParam(defaultValue = "20") int size,
                                     @RequestParam(defaultValue = "false") boolean all,
                                     @RequestParam(required = false) String q) {
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), Sort.by("createdAt").descending());
        Page<User> result;
        String needle = q == null ? "" : q.trim();
        if (!needle.isEmpty()) {
            // Search spans every role but players (they have their own pages).
            List<User.Role> roles = all ? NOT_PLAYERS : STAFF_ROLES;
            result = userRepository.findAll((root, query, cb) -> cb.and(root.get("role").in(roles), cb.or(
                    cb.like(root.get("phone"), "%" + needle + "%"),
                    cb.like(cb.lower(root.get("fullName")), "%" + needle.toLowerCase() + "%"))), pageable);
        } else if (all) {
            result = userRepository.findByRoleIn(NOT_PLAYERS, pageable);
        } else {
            result = userRepository.findByRoleIn(STAFF_ROLES, pageable);
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("items", result.getContent().stream().map(AdminSystemApiController::userRow).toList());
        out.put("totalPages", result.getTotalPages());
        out.put("totalItems", result.getTotalElements());
        return out;
    }

    @PostMapping("/users")
    @PreAuthorize(SUPER)
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> body) {
        String phone = text(body.get("phone"));
        String password = text(body.get("password"));
        User.Role role = role(body.get("role"));
        if (phone == null || password == null || role == null) return error(HttpStatus.BAD_REQUEST, "Cần nhập số điện thoại, mật khẩu và vai trò");
        if (password.length() < 6) return error(HttpStatus.BAD_REQUEST, "Mật khẩu tối thiểu 6 ký tự");
        if (userRepository.existsByPhone(phone)) return error(HttpStatus.BAD_REQUEST, "Số điện thoại đã tồn tại");
        String userid = "u" + System.currentTimeMillis() + (int) (Math.random() * 1000);
        if (userid.length() > 16) userid = userid.substring(0, 16);
        User u = User.builder().phone(phone).userid(userid).fullName(text(body.get("fullName"))).email(text(body.get("email")))
                .password(password).role(role).enabled(true).accountNonExpired(true).accountNonLocked(true).credentialsNonExpired(true).build();
        authenticationService.createUser(u);
        return ResponseEntity.ok(Map.of("message", "Đã tạo tài khoản"));
    }

    @PutMapping("/users/{id}")
    @PreAuthorize(SUPER)
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> body, Authentication auth) {
        User u = userRepository.findById(id).orElse(null);
        if (u == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản");
        User.Role role = role(body.get("role"));
        if (role == null) return error(HttpStatus.BAD_REQUEST, "Vai trò không hợp lệ");
        boolean enabled = !(body.get("enabled") instanceof Boolean b) || b;
        if (isSelf(u, auth) && (role != u.getRole() || !enabled)) return error(HttpStatus.BAD_REQUEST, "Không thể đổi vai trò hoặc vô hiệu hoá chính mình");
        u.setFullName(text(body.get("fullName")));
        u.setEmail(text(body.get("email")));
        u.setRole(role);
        u.setEnabled(enabled);
        userRepository.save(u);
        return ResponseEntity.ok(Map.of("message", "Đã cập nhật tài khoản"));
    }

    @PostMapping("/users/{id}/lock")
    @PreAuthorize(SUPER)
    public ResponseEntity<?> lock(@PathVariable Long id, Authentication auth) {
        User u = userRepository.findById(id).orElse(null);
        if (u == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản");
        if (isSelf(u, auth)) return error(HttpStatus.BAD_REQUEST, "Không thể khoá chính mình");
        u.setAccountNonLocked(false);
        userRepository.save(u);
        return ResponseEntity.ok(Map.of("message", "Đã khoá tài khoản"));
    }

    @PostMapping("/users/{id}/unlock")
    @PreAuthorize(SUPER)
    public ResponseEntity<?> unlock(@PathVariable Long id) {
        User u = userRepository.findById(id).orElse(null);
        if (u == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản");
        u.setAccountNonLocked(true);
        u.setEnabled(true);
        userRepository.save(u);
        return ResponseEntity.ok(Map.of("message", "Đã mở khoá tài khoản"));
    }

    /** Sets a fresh random password and returns it once. */
    @PostMapping("/users/{id}/reset-password")
    @PreAuthorize(SUPER)
    public ResponseEntity<?> resetPassword(@PathVariable Long id) {
        User u = userRepository.findById(id).orElse(null);
        if (u == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản");
        String alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
        SecureRandom rnd = new SecureRandom();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 8; i++) sb.append(alphabet.charAt(rnd.nextInt(alphabet.length())));
        u.setPassword(passwordEncoder.encode(sb));
        userRepository.save(u);
        return ResponseEntity.ok(Map.of("message", "Đã đặt lại mật khẩu", "password", sb.toString()));
    }

    // ==================== HELPERS ====================

    private boolean isSelf(User u, Authentication auth) {
        return auth != null && u.getUserid() != null && u.getUserid().equals(auth.getName());
    }

    private static Map<String, Object> userRow(User u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", u.getId());
        m.put("phone", u.getPhone());
        m.put("fullName", u.getFullName());
        m.put("email", u.getEmail());
        m.put("role", u.getRole() != null ? u.getRole().name() : null);
        m.put("enabled", Boolean.TRUE.equals(u.getEnabled()));
        m.put("locked", Boolean.FALSE.equals(u.getAccountNonLocked()));
        m.put("createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : null);
        return m;
    }

    private static User.Role role(Object o) {
        try {
            return o == null ? null : User.Role.valueOf(o.toString());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static String text(Object o) {
        if (o == null) return null;
        String s = o.toString().trim();
        return s.isEmpty() ? null : s;
    }

    private static ResponseEntity<Map<String, Object>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("message", message));
    }
}
