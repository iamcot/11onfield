package com.elevenof.backoffice.controller.admin;

import com.elevenof.backoffice.model.CompetitionPanelMember;
import com.elevenof.backoffice.model.CompetitionPanelMember.PanelRole;
import com.elevenof.backoffice.model.User;
import com.elevenof.backoffice.repository.CompetitionPanelMemberRepository;
import com.elevenof.backoffice.repository.CompetitionRepository;
import com.elevenof.backoffice.repository.UserRepository;
import com.elevenof.backoffice.service.PanelService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * The scouting panel of a competition: which coach (HLV) and scout (TTV) accounts work it. The admin picks them from
 * the website's coach and scout accounts; a change applies from the member's next sign-in to the admin site.
 */
@RestController
@RequestMapping("/api/admin/competitions/{id}/panel")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminPanelController {

    private final CompetitionRepository competitionRepository;
    private final CompetitionPanelMemberRepository memberRepository;
    private final UserRepository userRepository;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<?> list(@PathVariable Long id) {
        if (!competitionRepository.existsById(id)) return error(HttpStatus.NOT_FOUND, "Không tìm thấy giải đấu");
        List<CompetitionPanelMember> members = memberRepository.findByCompetitionIdOrderByPanelRoleAscIdAsc(id);
        Map<Long, User> users = userRepository.findAllById(members.stream().map(CompetitionPanelMember::getUserId).toList())
                .stream().collect(Collectors.toMap(User::getId, u -> u));
        List<Map<String, Object>> rows = new ArrayList<>();
        for (CompetitionPanelMember m : members) {
            User u = users.get(m.getUserId());
            if (u != null) rows.add(row(u, m.getPanelRole()));
        }
        return ResponseEntity.ok(Map.of("members", rows));
    }

    /** Coach and scout accounts whose name or phone contains q, for the "add to panel" search. */
    @GetMapping("/candidates")
    @Transactional(readOnly = true)
    public List<Map<String, Object>> candidates(@PathVariable Long id, @RequestParam(defaultValue = "") String q) {
        String needle = q.trim().toLowerCase();
        Set<Long> already = memberRepository.findByCompetitionIdOrderByPanelRoleAscIdAsc(id).stream()
                .map(CompetitionPanelMember::getUserId).collect(Collectors.toSet());
        return userRepository.findByRoleIn(List.of(User.Role.COACH, User.Role.SCOUTER), PageRequest.of(0, 500)).stream()
                .filter(u -> !already.contains(u.getId()))
                .filter(u -> needle.isEmpty() || (u.getFullName() != null && u.getFullName().toLowerCase().contains(needle))
                        || (u.getPhone() != null && u.getPhone().contains(needle)))
                .limit(20)
                .map(u -> row(u, u.getRole() == User.Role.COACH ? PanelRole.HLV : PanelRole.TTV))
                .toList();
    }

    /** body: { members: [{ userId, panelRole: HLV | TTV }] }; replaces the whole panel. */
    @PutMapping
    @Transactional
    public ResponseEntity<?> save(@PathVariable Long id, @RequestBody Map<String, Object> body, Authentication auth) {
        if (!competitionRepository.existsById(id)) return error(HttpStatus.NOT_FOUND, "Không tìm thấy giải đấu");
        Map<Long, PanelRole> wanted = new LinkedHashMap<>();
        if (body.get("members") instanceof List<?> list) {
            for (Object o : list) {
                if (!(o instanceof Map<?, ?> m)) continue;
                Long userId;
                PanelRole role;
                try {
                    userId = Long.valueOf(String.valueOf(m.get("userId")));
                    role = PanelRole.valueOf(String.valueOf(m.get("panelRole")));
                } catch (IllegalArgumentException e) {
                    return error(HttpStatus.BAD_REQUEST, "Mỗi thành viên cần tài khoản và vai trò HLV hoặc TTV");
                }
                User u = userRepository.findById(userId).orElse(null);
                if (u == null) return error(HttpStatus.BAD_REQUEST, "Không tìm thấy tài khoản " + userId);
                if (!PanelService.canJoin(u)) {
                    return error(HttpStatus.BAD_REQUEST, (u.getFullName() != null ? u.getFullName() : u.getPhone())
                            + " không phải tài khoản HLV hoặc tuyển trạch viên");
                }
                wanted.put(userId, role);
            }
        }
        Long me = userRepository.findByUserid(auth.getName()).map(User::getId).orElse(null);
        List<CompetitionPanelMember> current = memberRepository.findByCompetitionIdOrderByPanelRoleAscIdAsc(id);
        for (CompetitionPanelMember m : current) {
            PanelRole r = wanted.remove(m.getUserId());
            if (r == null) memberRepository.delete(m);
            else if (r != m.getPanelRole()) {
                m.setPanelRole(r);
                memberRepository.save(m);
            }
        }
        LocalDateTime now = LocalDateTime.now();
        wanted.forEach((userId, role) -> memberRepository.save(CompetitionPanelMember.builder()
                .competitionId(id).userId(userId).panelRole(role).addedBy(me).addedAt(now).build()));
        return ResponseEntity.ok(Map.of("message", "Đã lưu hội đồng tuyển trạch. Thành viên đăng nhập lại để nhận quyền mới."));
    }

    private static Map<String, Object> row(User u, PanelRole role) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("userId", u.getId());
        m.put("fullName", u.getFullName());
        m.put("phone", u.getPhone());
        m.put("websiteRole", u.getRole().name());
        m.put("panelRole", role.name());
        return m;
    }

    private static ResponseEntity<Map<String, Object>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("message", message));
    }
}
