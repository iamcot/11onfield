package com.elevenof.backoffice.controller.admin;

import com.elevenof.backoffice.model.*;
import com.elevenof.backoffice.model.JudgeNote.Participation;
import com.elevenof.backoffice.model.ParticipantFlag.Kind;
import com.elevenof.backoffice.repository.*;
import com.elevenof.backoffice.service.ParticipantFlagService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Scouting round 1 records kept by people rather than devices: judge ticks and notes (1.10), contestant flags (1.11),
 * Green Cards (1.12) and hand-entered scores (1.13). All of it sits under /api/admin and is read by the scoring later.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminScoutingApiController {

    private static final String MANAGER = "hasRole('ADMIN')";
    private static final String JUDGE = "hasAnyRole('HLV', 'TTV', 'ADMIN')";
    /** Everyone working a station may look a contestant up and see the flags. */
    private static final String FIELD_STAFF = "hasAnyRole('HLV', 'TTV', 'MEDICAL', 'ADMIN')";
    private static final String ANY_STAFF = "hasAnyRole('EDITOR', 'HLV', 'TTV', 'MEDICAL', 'ADMIN')";

    private static final int GREEN_CARD_COUNT = 4;

    private final CompetitionRepository competitionRepository;
    private final CompetitionStageRepository stageRepository;
    private final CompetitionParticipantRepository participantRepository;
    private final CompetitionAssessmentDayRepository dayRepository;
    private final CompetitionAssessmentStepRepository stepRepository;
    private final UserRepository userRepository;
    private final JudgeNoteRepository judgeNoteRepository;
    private final ParticipantFlagRepository flagRepository;
    private final GreenCardRepository greenCardRepository;
    private final ParticipantFlagService flagService;
    private final com.elevenof.backoffice.service.PanelService panelService;

    // ==================== LOOKUP ====================

    /** Live stage of the running competition with its days and steps, for the judge tablet. */
    @GetMapping("/scouting/context")
    @PreAuthorize(JUDGE)
    @Transactional(readOnly = true)
    public Map<String, Object> context() {
        Map<String, Object> out = new LinkedHashMap<>();
        Competition c = activeCompetition();
        if (c == null) return out;
        out.put("competition", Map.of("id", c.getId(), "title", c.getTitle()));
        List<CompetitionStage> all = stageRepository.findByCompetitionIdOrderByStageNumberAsc(c.getId());
        // Every round, so the panel can still enter manual scores once a round is over.
        out.put("stages", all.stream().map(s -> Map.of("id", s.getId(), "stageNumber", s.getStageNumber(), "title", s.getTitle(),
                "status", s.getStatus() != null ? s.getStatus().name() : "UPCOMING")).toList());
        CompetitionStage live = all.stream().filter(s -> s.getStatus() == StageStatus.LIVE).findFirst().orElse(null);
        if (live == null) return out;
        out.put("stage", Map.of("id", live.getId(), "stageNumber", live.getStageNumber(), "title", live.getTitle()));
        List<Map<String, Object>> days = new ArrayList<>();
        for (CompetitionAssessmentDay d : dayRepository.findByStageIdOrderByDisplayOrderAsc(live.getId())) {
            List<Map<String, Object>> steps = new ArrayList<>();
            for (CompetitionAssessmentStep s : stepRepository.findByAssessmentDayIdOrderByDisplayOrderAsc(d.getId())) {
                steps.add(Map.of("id", s.getId(), "title", label(s.getStepNumber(), s.getTitle()), "scoreSource", s.getScoreSource()));
            }
            days.add(Map.of("id", d.getId(), "title", label(d.getDayNumber(), d.getTitle()), "steps", steps));
        }
        out.put("days", days);
        return out;
    }

    /** Contestants of the running competition (search by SBD, name or phone) with their active flags. */
    @GetMapping("/scouting/participants")
    @PreAuthorize(FIELD_STAFF)
    @Transactional(readOnly = true)
    public Map<String, Object> participants(@RequestParam(defaultValue = "") String q) {
        Competition c = activeCompetition();
        if (c == null) return Map.of("participants", List.of());
        List<CompetitionParticipant> all = participantRepository.findByCompetitionIdWithUserOrderByRegistrationDate(c.getId());
        String needle = q.trim().toLowerCase();
        List<CompetitionParticipant> hit = new ArrayList<>();
        Map<Long, Integer> sbd = sbdMap(all);
        for (CompetitionParticipant p : all) {
            if (needle.isEmpty() || String.valueOf(sbd.get(p.getId())).equals(needle)
                    || (p.getUser().getFullName() != null && p.getUser().getFullName().toLowerCase().contains(needle))
                    || (p.getUser().getPhone() != null && p.getUser().getPhone().contains(needle))) {
                hit.add(p);
            }
            if (hit.size() >= 100) break;
        }
        Map<Long, List<ParticipantFlag>> flags = activeFlags(hit.stream().map(CompetitionParticipant::getId).toList());
        Map<Long, GreenCard> cards = greenCardRepository.findByCompetitionIdOrderByIdAsc(c.getId()).stream()
                .filter(g -> g.getParticipantId() != null).collect(Collectors.toMap(GreenCard::getParticipantId, g -> g, (a, b) -> a));
        List<Map<String, Object>> rows = new ArrayList<>();
        for (CompetitionParticipant p : hit) {
            Map<String, Object> m = participantRow(p, sbd.get(p.getId()));
            m.put("flags", flags.getOrDefault(p.getId(), List.of()).stream().map(f -> f.getKind().name()).distinct().toList());
            m.put("greenCard", cards.containsKey(p.getId()));
            rows.add(m);
        }
        return Map.of("competition", Map.of("id", c.getId(), "title", c.getTitle()), "participants", rows);
    }

    /** Everything about one contestant that the station staff may see: flags with history, judge records, Green Card. */
    @GetMapping("/scouting/participants/{participantId}")
    @PreAuthorize(FIELD_STAFF)
    @Transactional(readOnly = true)
    public ResponseEntity<?> participant(@PathVariable Long participantId, Authentication auth) {
        CompetitionParticipant p = participantRepository.findById(participantId).orElse(null);
        if (p == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy thí sinh");
        Long competitionId = p.getCompetition().getId();
        int sbd = sbdMap(participantRepository.findByCompetitionIdWithUserOrderByRegistrationDate(competitionId)).getOrDefault(p.getId(), 0);
        Map<String, Object> out = participantRow(p, sbd);
        out.put("blocked", flagService.isBlocked(p.getId()));

        List<ParticipantFlag> flags = flagRepository.findByParticipantIdOrderByCreatedAtDesc(p.getId());
        Map<Long, User> users = usersById(flags.stream().flatMap(f -> java.util.stream.Stream.of(f.getCreatedBy(), f.getRevokedBy())).filter(Objects::nonNull).toList());
        out.put("flags", flags.stream().map(f -> flagRow(f, users)).toList());
        out.put("disciplineCount", flagService.disciplineCount(p.getId()));

        // A scout (TTV) sees only their own notes; the head coach (HLV) and admins see everyone's.
        User me = currentUser(auth);
        boolean seeAll = hasRole(auth, "ADMIN") || hasRole(auth, "HLV");
        List<Map<String, Object>> notes = new ArrayList<>();
        if (seeAll || hasRole(auth, "TTV")) {
            List<JudgeNote> list = judgeNoteRepository.findByParticipantIdOrderByUpdatedAtDesc(p.getId());
            Map<Long, User> judges = usersById(list.stream().map(JudgeNote::getJudgeUserId).toList());
            Map<Long, CompetitionAssessmentStep> steps = stepRepository.findAllById(list.stream().map(JudgeNote::getStepId).toList())
                    .stream().collect(Collectors.toMap(CompetitionAssessmentStep::getId, s -> s));
            for (JudgeNote n : list) {
                if (!seeAll && !n.getJudgeUserId().equals(me.getId())) continue;
                notes.add(noteRow(n, judges.get(n.getJudgeUserId()), steps.get(n.getStepId())));
            }
        }
        out.put("judgeNotes", notes);

        greenCardRepository.findByCompetitionIdAndParticipantId(competitionId, p.getId()).ifPresent(g -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("holderTitle", g.getHolderTitle());
            m.put("reason", g.getReason());
            m.put("usedAt", String.valueOf(g.getUsedAt()));
            out.put("greenCard", m);
        });
        greenCardRepository.findByCompetitionIdAndHolderUserId(competitionId, me.getId()).ifPresent(g ->
                out.put("myGreenCard", Map.of("id", g.getId(), "title", g.getHolderTitle(), "used", g.getUsedAt() != null)));
        return ResponseEntity.ok(out);
    }

    // ==================== 1.10 JUDGE NOTES ====================

    /** Contestants of the running competition with this judge's record for one step. */
    @GetMapping("/judge-notes")
    @PreAuthorize(JUDGE)
    @Transactional(readOnly = true)
    public ResponseEntity<?> judgeNotes(@RequestParam Long stepId, @RequestParam(defaultValue = "") String q, Authentication auth) {
        Competition c = activeCompetition();
        if (c == null) return error(HttpStatus.NOT_FOUND, "Chưa có giải đấu đang diễn ra");
        User me = currentUser(auth);
        List<CompetitionParticipant> all = participantRepository.findByCompetitionIdWithUserOrderByRegistrationDate(c.getId());
        Map<Long, Integer> sbd = sbdMap(all);
        Map<Long, JudgeNote> mine = judgeNoteRepository.findByJudgeUserIdAndStepId(me.getId(), stepId).stream()
                .collect(Collectors.toMap(JudgeNote::getParticipantId, n -> n));
        Set<Long> blocked = flagService.blockedAmong(all.stream().map(CompetitionParticipant::getId).toList());
        String needle = q.trim().toLowerCase();
        List<Map<String, Object>> rows = new ArrayList<>();
        for (CompetitionParticipant p : all) {
            if (p.getStatus() == ParticipantStatus.WITHDRAWN) continue;
            if (!needle.isEmpty() && !String.valueOf(sbd.get(p.getId())).equals(needle)
                    && (p.getUser().getFullName() == null || !p.getUser().getFullName().toLowerCase().contains(needle))) continue;
            Map<String, Object> m = participantRow(p, sbd.get(p.getId()));
            m.put("blocked", blocked.contains(p.getId()));
            JudgeNote n = mine.get(p.getId());
            m.put("note", n == null ? null : Map.of(
                    "participation", n.getParticipation().name(), "ticked", Boolean.TRUE.equals(n.getTicked()),
                    "note", n.getNote() == null ? "" : n.getNote()));
            rows.add(m);
        }
        return ResponseEntity.ok(Map.of("participants", rows, "recorded", mine.size(), "total", rows.size()));
    }

    /** body: { stepId, participantId, participation: FULL|PARTIAL|NONE, ticked, note } */
    @PutMapping("/judge-notes")
    @PreAuthorize(JUDGE)
    @Transactional
    public ResponseEntity<?> saveJudgeNote(@RequestBody Map<String, Object> body, Authentication auth) {
        Long stepId = longOf(body.get("stepId"));
        Long participantId = longOf(body.get("participantId"));
        if (stepId == null || participantId == null) return error(HttpStatus.BAD_REQUEST, "Thiếu thông tin thí sinh hoặc bài thi");
        Participation participation;
        try {
            participation = Participation.valueOf(String.valueOf(body.get("participation")));
        } catch (IllegalArgumentException e) {
            return error(HttpStatus.BAD_REQUEST, "Mức tham gia không hợp lệ");
        }
        if (!stepRepository.existsById(stepId) || !participantRepository.existsById(participantId)) {
            return error(HttpStatus.NOT_FOUND, "Không tìm thấy thí sinh hoặc bài thi");
        }
        if (flagService.isBlocked(participantId)) return error(HttpStatus.CONFLICT, "Thí sinh đã bị bác sĩ loại khỏi vòng thi");
        User me = currentUser(auth);
        JudgeNote n = judgeNoteRepository.findByJudgeUserIdAndParticipantIdAndStepId(me.getId(), participantId, stepId)
                .orElseGet(() -> JudgeNote.builder().judgeUserId(me.getId()).participantId(participantId).stepId(stepId).build());
        n.setParticipation(participation);
        n.setTicked(Boolean.TRUE.equals(body.get("ticked")));
        String note = str(body.get("note"));
        n.setNote(note);
        judgeNoteRepository.save(n);
        return ResponseEntity.ok(Map.of("message", "Đã lưu ghi nhận"));
    }

    // ==================== 1.11 FLAGS ====================

    /** body: { kind: MEDICAL_OUT|DISCIPLINE|DNS, reason, stepId? } */
    @PostMapping("/scouting/participants/{participantId}/flags")
    @PreAuthorize(FIELD_STAFF)
    @Transactional
    public ResponseEntity<?> addFlag(@PathVariable Long participantId, @RequestBody Map<String, Object> body, Authentication auth) {
        CompetitionParticipant p = participantRepository.findById(participantId).orElse(null);
        if (p == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy thí sinh");
        Kind kind;
        try {
            kind = Kind.valueOf(String.valueOf(body.get("kind")));
        } catch (IllegalArgumentException e) {
            return error(HttpStatus.BAD_REQUEST, "Loại cờ không hợp lệ");
        }
        if (kind == Kind.LOW_PERFORMANCE) return error(HttpStatus.BAD_REQUEST, "Cờ Low Performance do hệ thống tự tạo");
        if (!canRaise(auth, kind)) return error(HttpStatus.FORBIDDEN, "Bạn không có quyền đặt cờ này");
        String reason = str(body.get("reason"));
        if (reason == null && kind != Kind.DNS) return error(HttpStatus.BAD_REQUEST, "Cần ghi lý do");
        if (kind == Kind.MEDICAL_OUT && flagService.isBlocked(participantId)) return error(HttpStatus.CONFLICT, "Thí sinh đã có cờ y tế đang hiệu lực");
        User me = currentUser(auth);
        ParticipantFlag f = flagRepository.save(ParticipantFlag.builder()
                .participantId(participantId).kind(kind).reason(reason).stepId(longOf(body.get("stepId")))
                .stageId(liveStageId(p.getCompetition().getId())).createdBy(me.getId()).createdAt(LocalDateTime.now()).build());
        return ResponseEntity.ok(flagRow(f, Map.of(me.getId(), me)));
    }

    /** body: { reason } */
    @PostMapping("/scouting/flags/{flagId}/revoke")
    @PreAuthorize(FIELD_STAFF)
    @Transactional
    public ResponseEntity<?> revokeFlag(@PathVariable Long flagId, @RequestBody Map<String, Object> body, Authentication auth) {
        ParticipantFlag f = flagRepository.findById(flagId).orElse(null);
        if (f == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy cờ");
        if (f.getRevokedAt() != null) return error(HttpStatus.CONFLICT, "Cờ đã được gỡ");
        boolean allowed = f.getKind() == Kind.LOW_PERFORMANCE
                ? hasRole(auth, "ADMIN") || hasRole(auth, "HLV")
                : canRaise(auth, f.getKind());
        if (!allowed) return error(HttpStatus.FORBIDDEN, "Bạn không có quyền gỡ cờ này");
        String reason = str(body.get("reason"));
        if (reason == null) return error(HttpStatus.BAD_REQUEST, "Cần ghi lý do gỡ cờ");
        flagService.revoke(flagId, currentUser(auth).getId(), reason);
        return ResponseEntity.ok(Map.of("message", "Đã gỡ cờ"));
    }

    /** Doctor: medical. The scouting panel (HLV, TTV): discipline and did not start. Admins may do all. */
    private static boolean canRaise(Authentication auth, Kind kind) {
        if (hasRole(auth, "ADMIN")) return true;
        return switch (kind) {
            case MEDICAL_OUT -> hasRole(auth, "MEDICAL");
            case DISCIPLINE, DNS -> hasRole(auth, "HLV") || hasRole(auth, "TTV");
            case LOW_PERFORMANCE -> false;
        };
    }

    // ==================== 1.12 GREEN CARD ====================

    @GetMapping("/competitions/{id}/green-cards")
    @PreAuthorize(MANAGER)
    @Transactional(readOnly = true)
    public Map<String, Object> greenCards(@PathVariable Long id) {
        List<GreenCard> cards = greenCardRepository.findByCompetitionIdOrderByIdAsc(id);
        Map<Long, User> users = usersById(cards.stream().map(GreenCard::getHolderUserId).toList());
        Map<Long, CompetitionParticipant> ps = participantRepository.findAllById(
                cards.stream().map(GreenCard::getParticipantId).filter(Objects::nonNull).toList()
        ).stream().collect(Collectors.toMap(CompetitionParticipant::getId, p -> p));
        Map<Long, Integer> sbd = sbdMap(participantRepository.findByCompetitionIdWithUserOrderByRegistrationDate(id));
        List<Map<String, Object>> rows = new ArrayList<>();
        for (GreenCard g : cards) {
            Map<String, Object> m = new LinkedHashMap<>();
            User u = users.get(g.getHolderUserId());
            m.put("id", g.getId());
            m.put("holderUserId", g.getHolderUserId());
            m.put("holderName", u != null ? u.getFullName() : null);
            m.put("holderPhone", u != null ? u.getPhone() : null);
            m.put("title", g.getHolderTitle());
            m.put("used", g.getUsedAt() != null);
            if (g.getParticipantId() != null && ps.containsKey(g.getParticipantId())) {
                m.put("participant", participantRow(ps.get(g.getParticipantId()), sbd.getOrDefault(g.getParticipantId(), 0)));
            }
            m.put("reason", g.getReason());
            m.put("usedAt", g.getUsedAt() != null ? g.getUsedAt().toString() : null);
            rows.add(m);
        }
        return Map.of("cards", rows, "limit", GREEN_CARD_COUNT);
    }

    /** body: { holders: [{ userId, title }] } up to 4. Cards already used cannot be removed. */
    @PutMapping("/competitions/{id}/green-cards")
    @PreAuthorize(MANAGER)
    @Transactional
    public ResponseEntity<?> setGreenCardHolders(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        if (!competitionRepository.existsById(id)) return error(HttpStatus.NOT_FOUND, "Không tìm thấy giải đấu");
        List<?> holders = body.get("holders") instanceof List<?> l ? l : List.of();
        if (holders.size() > GREEN_CARD_COUNT) return error(HttpStatus.BAD_REQUEST, "Mỗi giải chỉ có " + GREEN_CARD_COUNT + " Green Card");
        Map<Long, String> wanted = new LinkedHashMap<>();
        for (Object o : holders) {
            if (!(o instanceof Map<?, ?> h)) continue;
            Long userId = longOf(h.get("userId"));
            String title = str(h.get("title"));
            if (userId == null || title == null) return error(HttpStatus.BAD_REQUEST, "Mỗi người giữ thẻ cần có tài khoản và chức danh");
            if (wanted.put(userId, title) != null) return error(HttpStatus.BAD_REQUEST, "Một người chỉ giữ một Green Card");
            if (panelService.roleIn(id, userId).orElse(null) != CompetitionPanelMember.PanelRole.HLV) {
                return error(HttpStatus.BAD_REQUEST, "Người giữ thẻ phải là HLV trong hội đồng tuyển trạch của giải");
            }
        }
        List<GreenCard> existing = greenCardRepository.findByCompetitionIdOrderByIdAsc(id);
        for (GreenCard g : existing) {
            boolean kept = wanted.containsKey(g.getHolderUserId());
            if (g.getUsedAt() != null && !kept) return error(HttpStatus.CONFLICT, "Thẻ đã dùng, không thể thu hồi hoặc đổi người giữ");
        }
        for (GreenCard g : existing) {
            if (!wanted.containsKey(g.getHolderUserId())) greenCardRepository.delete(g);
            else if (g.getUsedAt() == null) { g.setHolderTitle(wanted.get(g.getHolderUserId())); greenCardRepository.save(g); }
        }
        Set<Long> have = existing.stream().map(GreenCard::getHolderUserId).collect(Collectors.toSet());
        wanted.forEach((userId, title) -> {
            if (!have.contains(userId)) greenCardRepository.save(GreenCard.builder().competitionId(id).holderUserId(userId).holderTitle(title).build());
        });
        return ResponseEntity.ok(Map.of("message", "Đã lưu danh sách người giữ Green Card"));
    }

    /** body: { participantId, reason, confirmed: true }. The holder uses their own card, once, for good. */
    @PostMapping("/scouting/green-card/use")
    @PreAuthorize(ANY_STAFF)
    @Transactional
    public ResponseEntity<?> useGreenCard(@RequestBody Map<String, Object> body, Authentication auth) {
        Long participantId = longOf(body.get("participantId"));
        CompetitionParticipant p = participantId == null ? null : participantRepository.findById(participantId).orElse(null);
        if (p == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy thí sinh");
        if (!Boolean.TRUE.equals(body.get("confirmed"))) return error(HttpStatus.BAD_REQUEST, "Cần xác nhận trước khi dùng Green Card");
        String reason = str(body.get("reason"));
        if (reason == null) return error(HttpStatus.BAD_REQUEST, "Cần ghi lý do");
        Long competitionId = p.getCompetition().getId();
        GreenCard card = greenCardRepository.findByCompetitionIdAndHolderUserId(competitionId, currentUser(auth).getId()).orElse(null);
        if (card == null) return error(HttpStatus.FORBIDDEN, "Bạn không giữ Green Card của giải này");
        if (card.getUsedAt() != null) return error(HttpStatus.CONFLICT, "Green Card của bạn đã được sử dụng");
        if (p.getStatus() == ParticipantStatus.WITHDRAWN) return error(HttpStatus.CONFLICT, "Thí sinh đã rút khỏi giải");
        if (greenCardRepository.findByCompetitionIdAndParticipantId(competitionId, participantId).isPresent()) {
            return error(HttpStatus.CONFLICT, "Thí sinh này đã có Green Card");
        }
        card.setParticipantId(participantId);
        card.setReason(reason);
        card.setUsedAt(LocalDateTime.now());
        greenCardRepository.save(card);
        return ResponseEntity.ok(Map.of("message", "Đã dùng Green Card: thí sinh vào thẳng Top 30"));
    }

    // ==================== HELPERS ====================

    private Competition activeCompetition() {
        List<Competition> active = competitionRepository.findByStatusNotInOrderBySeasonDesc(
                List.of(CompetitionStatus.DRAFT, CompetitionStatus.COMPLETED));
        return active.isEmpty() ? null : active.get(0);
    }

    private Long liveStageId(Long competitionId) {
        return stageRepository.findByCompetitionIdOrderByStageNumberAsc(competitionId).stream()
                .filter(s -> s.getStatus() == StageStatus.LIVE).map(CompetitionStage::getId).findFirst().orElse(null);
    }

    /** SBD = position in registration order, the same numbering the scoring screen uses. */
    private static Map<Long, Integer> sbdMap(List<CompetitionParticipant> all) {
        Map<Long, Integer> m = new HashMap<>();
        for (int i = 0; i < all.size(); i++) m.put(all.get(i).getId(), i + 1);
        return m;
    }

    private Map<Long, List<ParticipantFlag>> activeFlags(List<Long> participantIds) {
        if (participantIds.isEmpty()) return Map.of();
        return flagRepository.findByParticipantIdInAndRevokedAtIsNull(participantIds).stream()
                .collect(Collectors.groupingBy(ParticipantFlag::getParticipantId));
    }

    private Map<Long, User> usersById(Collection<Long> ids) {
        if (ids.isEmpty()) return Map.of();
        return userRepository.findAllById(new HashSet<>(ids)).stream().collect(Collectors.toMap(User::getId, u -> u));
    }

    private User currentUser(Authentication auth) {
        return userRepository.findByUserid(auth.getName()).orElseThrow(() -> new IllegalStateException("Không xác định được người dùng"));
    }

    private static boolean hasRole(Authentication auth, String role) {
        return auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_" + role));
    }

    private static Map<String, Object> participantRow(CompetitionParticipant p, int sbd) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.getId());
        m.put("sbd", sbd);
        m.put("fullName", p.getUser().getFullName());
        m.put("phone", p.getUser().getPhone());
        m.put("avatar", p.getUser().getAvatar());
        m.put("status", p.getStatus() != null ? p.getStatus().name() : null);
        m.put("region", p.getSelectedRegion() != null ? p.getSelectedRegion().name() : null);
        return m;
    }

    private static Map<String, Object> flagRow(ParticipantFlag f, Map<Long, User> users) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", f.getId());
        m.put("kind", f.getKind().name());
        m.put("stepId", f.getStepId());
        m.put("reason", f.getReason());
        m.put("createdAt", f.getCreatedAt().toString());
        m.put("createdBy", f.getCreatedBy() == null ? "Hệ thống" : name(users.get(f.getCreatedBy())));
        m.put("active", f.getRevokedAt() == null);
        if (f.getRevokedAt() != null) {
            m.put("revokedAt", f.getRevokedAt().toString());
            m.put("revokedBy", name(users.get(f.getRevokedBy())));
            m.put("revokeReason", f.getRevokeReason());
        }
        return m;
    }

    private static Map<String, Object> noteRow(JudgeNote n, User judge, CompetitionAssessmentStep step) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("judge", name(judge));
        m.put("step", step != null ? label(step.getStepNumber(), step.getTitle()) : null);
        m.put("participation", n.getParticipation().name());
        m.put("ticked", Boolean.TRUE.equals(n.getTicked()));
        m.put("note", n.getNote());
        m.put("updatedAt", n.getUpdatedAt().toString());
        return m;
    }

    private static String name(User u) {
        return u == null ? null : (u.getFullName() != null ? u.getFullName() : u.getPhone());
    }

    private static String label(Integer number, String title) {
        return (number != null ? number + ". " : "") + (title != null ? title : "");
    }

    private static String str(Object o) {
        if (o == null) return null;
        String s = o.toString().trim();
        return s.isEmpty() || "null".equals(s) ? null : s;
    }

    private static Long longOf(Object o) {
        try {
            return o == null ? null : Long.valueOf(o.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static ResponseEntity<Map<String, Object>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("message", message));
    }

}
