package com.elevenof.backoffice.controller.admin;

import com.elevenof.backoffice.model.*;
import com.elevenof.backoffice.repository.*;
import com.elevenof.backoffice.scoring.RoundFormula;
import com.elevenof.backoffice.service.CompetitionSelectionService;
import com.elevenof.backoffice.service.RoundScoringService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Round formula, round scores, the ranking across regions and the hand-picked selection (judges' votes, then the head
 * of the panel's decision). The system only orders people; it never picks them.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminRoundController {

    private static final String STAFF_AND_JUDGES = "hasAnyRole('HLV', 'TTV', 'ADMIN')";
    private static final String PANEL = "hasAnyRole('HLV', 'TTV')";
    private static final int TOP30 = 30;

    private final RoundScoringService roundScoringService;
    private final CompetitionSelectionService selectionService;
    private final CompetitionRepository competitionRepository;
    private final SelectionVoteRepository voteRepository;
    private final SelectionDecisionRepository decisionRepository;
    private final GreenCardRepository greenCardRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final com.elevenof.backoffice.service.PanelService panelService;

    // ==================== FORMULA ====================

    @GetMapping("/stages/{stageId}/formula")
    public RoundScoringService.FormulaView formula(@PathVariable Long stageId) {
        return roundScoringService.formula(stageId);
    }

    /** body: a RoundFormula (components, topicManual, classes, tieBreak); saved as a new version. */
    @PutMapping("/stages/{stageId}/formula")
    public RoundScoringService.FormulaView saveFormula(@PathVariable Long stageId, @RequestBody RoundFormula definition) {
        return roundScoringService.saveFormula(stageId, definition, currentUserId());
    }

    @PostMapping("/stages/{stageId}/formula/lock")
    public RoundScoringService.FormulaView lockFormula(@PathVariable Long stageId) {
        return roundScoringService.lockFormula(stageId, currentUserId());
    }

    // ==================== SCORES AND RANKING ====================

    @PostMapping("/stages/{stageId}/round-scores/recompute")
    public Map<String, Object> recompute(@PathVariable Long stageId) {
        int n = roundScoringService.recompute(stageId);
        return Map.of("message", "Đã tính lại điểm vòng cho " + n + " thí sinh", "count", n);
    }

    /**
     * Ranking across the given stages (all when none). goalkeeper=true|false gives one list; region filters;
     * roundKey adds the judges' vote count for that selection round.
     */
    @GetMapping("/competitions/{id}/ranking")
    @PreAuthorize(STAFF_AND_JUDGES)
    public ResponseEntity<?> ranking(@PathVariable Long id, @RequestParam(required = false) List<Long> stageIds,
                                     @RequestParam(required = false) Boolean goalkeeper,
                                     @RequestParam(required = false) Region region,
                                     @RequestParam(defaultValue = "TOP30") String roundKey) {
        if (!competitionRepository.existsById(id)) return error(HttpStatus.NOT_FOUND, "Không tìm thấy giải đấu");
        return ResponseEntity.ok(roundScoringService.ranking(id, stageIds, goalkeeper, region, roundKey));
    }

    // ==================== VOTES ====================

    /** The caller's own picks, and (head coach and admins) how many panel members picked each participant. */
    @GetMapping("/competitions/{id}/selection/{roundKey}/votes")
    @PreAuthorize(STAFF_AND_JUDGES)
    @Transactional(readOnly = true)
    public Map<String, Object> votes(@PathVariable Long id, @PathVariable String roundKey) {
        User me = currentUser();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("mine", voteRepository.findByCompetitionIdAndRoundKeyAndJudgeUserId(id, roundKey, me.getId()).stream()
                .map(SelectionVote::getParticipantId).toList());
        out.put("limit", TOP30);
        boolean seesCounts = me.getRole() == User.Role.ADMIN
                || panelService.roleIn(id, me.getId()).orElse(null) == CompetitionPanelMember.PanelRole.HLV;
        if (seesCounts) {
            List<SelectionVote> all = voteRepository.findByCompetitionIdAndRoundKey(id, roundKey);
            out.put("counts", all.stream().collect(Collectors.groupingBy(SelectionVote::getParticipantId, Collectors.counting())));
            out.put("judges", all.stream().map(SelectionVote::getJudgeUserId).distinct().count());
        }
        return out;
    }

    /** Replaces the caller's picks. body: { participantIds: [...] }, at most 30. */
    @PutMapping("/competitions/{id}/selection/{roundKey}/votes")
    @PreAuthorize(PANEL)
    @Transactional
    public ResponseEntity<?> vote(@PathVariable Long id, @PathVariable String roundKey, @RequestBody Map<String, Object> body) {
        List<Long> ids = ids(body.get("participantIds"));
        if (ids.size() > TOP30) return error(HttpStatus.BAD_REQUEST, "Chỉ chọn tối đa " + TOP30 + " người");
        if (decisionRepository.findFirstByCompetitionIdAndRoundKeyOrderByIdDesc(id, roundKey).isPresent()) {
            return error(HttpStatus.CONFLICT, "Danh sách đã chốt, không bỏ phiếu được nữa");
        }
        User me = currentUser();
        if (panelService.roleIn(id, me.getId()).isEmpty()) return error(HttpStatus.FORBIDDEN, "Bạn không ở trong hội đồng tuyển trạch của giải này");
        voteRepository.deleteAll(voteRepository.findByCompetitionIdAndRoundKeyAndJudgeUserId(id, roundKey, me.getId()));
        voteRepository.flush();
        LocalDateTime now = LocalDateTime.now();
        for (Long pid : new LinkedHashSet<>(ids)) {
            voteRepository.save(SelectionVote.builder().competitionId(id).roundKey(roundKey).judgeUserId(me.getId())
                    .participantId(pid).createdAt(now).build());
        }
        return ResponseEntity.ok(votes(id, roundKey));
    }

    // ==================== DECISION ====================

    @GetMapping("/competitions/{id}/selection/{roundKey}/decision")
    @PreAuthorize(STAFF_AND_JUDGES)
    public ResponseEntity<?> decision(@PathVariable Long id, @PathVariable String roundKey) {
        return decisionRepository.findFirstByCompetitionIdAndRoundKeyOrderByIdDesc(id, roundKey)
                .<ResponseEntity<?>>map(d -> ResponseEntity.ok(decisionView(d)))
                .orElseGet(() -> ResponseEntity.ok(Map.of()));
    }

    /**
     * The head coach (HLV) of the competition's panel picks. body: { participantIds: [...], notes: { "<participantId>": "why" } }.
     * Picking someone ranked below 30, or leaving out someone ranked in the top 30 with a complete score, needs a note;
     * a participant a Green Card was used on must be in the list. For TOP30 the list must hold exactly 30 and the
     * participants' statuses are updated (with notifications) as before.
     */
    @PostMapping("/competitions/{id}/selection/{roundKey}/decision")
    @PreAuthorize("hasRole('HLV')")
    @Transactional
    public ResponseEntity<?> decide(@PathVariable Long id, @PathVariable String roundKey, @RequestBody Map<String, Object> body,
                                    @RequestParam(required = false) List<Long> stageIds) {
        if (panelService.roleIn(id, currentUserId()).orElse(null) != CompetitionPanelMember.PanelRole.HLV) {
            return error(HttpStatus.FORBIDDEN, "Chỉ HLV của hội đồng tuyển trạch giải này được chốt danh sách");
        }
        List<Long> picked = new ArrayList<>(new LinkedHashSet<>(ids(body.get("participantIds"))));
        Map<String, String> notes = new HashMap<>();
        if (body.get("notes") instanceof Map<?, ?> m) {
            m.forEach((k, v) -> {
                if (v != null && !v.toString().isBlank()) notes.put(k.toString(), v.toString().trim());
            });
        }
        if ("TOP30".equals(roundKey)
                && decisionRepository.findFirstByCompetitionIdAndRoundKeyOrderByIdDesc(id, roundKey).isPresent()) {
            return error(HttpStatus.CONFLICT, "Top 30 đã chốt và đã báo cho thí sinh, không chốt lại được");
        }
        if ("TOP30".equals(roundKey) && picked.size() != TOP30) {
            return error(HttpStatus.BAD_REQUEST, "Phải chọn đúng " + TOP30 + " người, đang có " + picked.size());
        }
        Set<Long> greenCards = greenCardRepository.findByCompetitionIdOrderByIdAsc(id).stream()
                .map(GreenCard::getParticipantId).filter(Objects::nonNull).collect(Collectors.toSet());
        List<Long> missingGreen = greenCards.stream().filter(g -> !picked.contains(g)).toList();
        if (!missingGreen.isEmpty()) return error(HttpStatus.BAD_REQUEST, "Thiếu người có Green Card: " + missingGreen);

        List<Map<String, Object>> ranking = roundScoringService.ranking(id, stageIds, null, null, roundKey);
        Map<Long, Integer> rankOf = new HashMap<>();
        Set<Long> topComplete = new HashSet<>();
        for (Map<String, Object> r : ranking) {
            Long pid = (Long) r.get("participantId");
            int rank = (Integer) r.get("rank");
            rankOf.put(pid, rank);
            if (rank <= TOP30 && Boolean.TRUE.equals(r.get("complete"))) topComplete.add(pid);
        }
        List<Long> needNote = new ArrayList<>();
        for (Long pid : picked) {
            Integer rank = rankOf.get(pid);
            if ((rank == null || rank > TOP30) && !greenCards.contains(pid) && !notes.containsKey(pid.toString())) needNote.add(pid);
        }
        for (Long pid : topComplete) {
            if (!picked.contains(pid) && !notes.containsKey(pid.toString())) needNote.add(pid);
        }
        if (!needNote.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cần ghi lý do cho người chọn ngoài thứ tự điểm",
                    "needNote", needNote));
        }

        SelectionDecision d = decisionRepository.save(SelectionDecision.builder()
                .competitionId(id).roundKey(roundKey).participantIds(json(picked)).notes(json(notes))
                .decidedBy(currentUser().getId()).decidedAt(LocalDateTime.now()).build());
        if ("TOP30".equals(roundKey)) selectionService.selectTop30(id, picked);
        return ResponseEntity.ok(decisionView(d));
    }

    // ==================== HELPERS ====================

    private Map<String, Object> decisionView(SelectionDecision d) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", d.getId());
        m.put("roundKey", d.getRoundKey());
        try {
            m.put("participantIds", objectMapper.readValue(d.getParticipantIds(), List.class));
            m.put("notes", d.getNotes() != null ? objectMapper.readValue(d.getNotes(), Map.class) : Map.of());
        } catch (JsonProcessingException e) {
            m.put("participantIds", List.of());
        }
        m.put("decidedBy", d.getDecidedBy());
        m.put("decidedAt", d.getDecidedAt());
        return m;
    }

    private String json(Object o) {
        try {
            return objectMapper.writeValueAsString(o);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }

    private static List<Long> ids(Object o) {
        List<Long> out = new ArrayList<>();
        if (o instanceof List<?> l) {
            for (Object x : l) {
                try {
                    out.add(Long.valueOf(x.toString()));
                } catch (NumberFormatException ignored) {
                }
            }
        }
        return out;
    }

    private User currentUser() {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByUserid(auth.getName()).or(() -> userRepository.findByPhone(auth.getName()))
                .orElseThrow(() -> new IllegalArgumentException("Không xác định được người dùng"));
    }

    private Long currentUserId() {
        return currentUser().getId();
    }

    private static ResponseEntity<Map<String, Object>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("message", message));
    }
}
