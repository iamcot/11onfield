package com.elevenof.backoffice.controller.admin;

import com.elevenof.backoffice.model.*;
import com.elevenof.backoffice.repository.*;
import com.elevenof.backoffice.service.MeasurementService;
import com.elevenof.backoffice.service.ScoringService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Scouting combine config, reconciliation and scores for the Next.js admin. The 5-level scale itself is saved through
 * CompetitionAssessmentController's rating-scale endpoint, which takes per-assessment conditions.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCombineController {

    private static final Set<String> VALUE_TYPES = Set.of("NUMBER", "DURATION", "COUNT");

    private final CompetitionAssessmentDayRepository dayRepository;
    private final CompetitionAssessmentStepRepository stepRepository;
    private final CompetitionAssessmentRepository assessmentRepository;
    private final CompetitionAssessmentStepRatingRepository ratingRepository;
    private final CompetitionScoreTopicRepository topicRepository;
    private final MeasurementOfficialRepository officialRepository;
    private final MeasurementRawRepository rawRepository;
    private final CompetitionParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final MeasurementService measurementService;
    private final ScoringService scoringService;
    private final com.elevenof.backoffice.service.RoundScoringService roundScoringService;

    // ==================== CONFIG ====================

    /** Everything the scale editor needs for one step. */
    @GetMapping("/assessment-steps/{stepId}/combine-config")
    @PreAuthorize("hasAnyRole('EDITOR', 'ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<?> stepConfig(@PathVariable Long stepId) {
        CompetitionAssessmentStep step = stepRepository.findById(stepId).orElse(null);
        if (step == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy bài thi");
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("stepId", step.getId());
        out.put("title", step.getTitle());
        out.put("isScored", step.getIsScored());
        out.put("audience", step.getAudience());
        out.put("scoreSource", step.getScoreSource());
        out.put("topicId", step.getTopicId());
        out.put("locked", measurementService.isLocked(stepId));
        out.put("assessments", assessmentRepository.findByAssessmentStepIdOrderByDisplayOrderAsc(stepId).stream().map(a -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", a.getId());
            m.put("title", a.getTitle());
            m.put("unit", a.getUnit());
            m.put("attemptsCount", a.getAttemptsCount());
            m.put("scoringMethod", a.getScoringMethod());
            m.put("direction", a.getDirection());
            m.put("plausibleMin", a.getPlausibleMin());
            m.put("plausibleMax", a.getPlausibleMax());
            m.put("tolerance", a.getTolerance());
            m.put("valueType", a.getValueType());
            m.put("faultReasons", faultList(a.getFaultReasons()));
            return m;
        }).toList());
        out.put("levels", ratingRepository.findByAssessmentStepIdOrderByLevelDesc(stepId).stream().map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("level", r.getLevel());
            m.put("color", r.getColor());
            m.put("action", r.getAction());
            m.put("description", r.getDescription());
            m.put("thresholdType", r.getThresholdType());
            m.put("thresholdValue", r.getThresholdValue());
            m.put("rangeMin", r.getRangeMin());
            m.put("rangeMax", r.getRangeMax());
            m.put("conditions", r.getConditions().stream().map(c -> {
                Map<String, Object> cm = new LinkedHashMap<>();
                cm.put("assessmentId", c.getAssessmentId());
                cm.put("min", c.getRangeMin());
                cm.put("max", c.getRangeMax());
                return cm;
            }).toList());
            return m;
        }).toList());
        out.put("topics", topicRepository.findByAssessmentDayIdOrderByDisplayOrderAsc(step.getAssessmentDay().getId()).stream()
                .map(AdminCombineController::topic).toList());
        return ResponseEntity.ok(out);
    }

    /** body: { isScored?, audience?, scoreSource? (MEASURED | HLV), topicId? (null clears) } */
    @PutMapping("/assessment-steps/{stepId}/combine-config")
    @Transactional
    public ResponseEntity<?> updateStepConfig(@PathVariable Long stepId, @RequestBody Map<String, Object> body) {
        CompetitionAssessmentStep step = stepRepository.findById(stepId).orElse(null);
        if (step == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy bài thi");
        if (body.containsKey("isScored")) step.setIsScored(Boolean.TRUE.equals(body.get("isScored")));
        if (body.get("scoreSource") != null) step.setScoreSource("HLV".equals(String.valueOf(body.get("scoreSource"))) ? "HLV" : "MEASURED");
        if (body.get("audience") != null) {
            try {
                step.setAudience(StepAudience.valueOf(body.get("audience").toString()));
            } catch (IllegalArgumentException e) {
                return error(HttpStatus.BAD_REQUEST, "Đối tượng không hợp lệ");
            }
        }
        if (body.containsKey("topicId")) {
            Long topicId = longOf(body.get("topicId"));
            if (topicId != null) {
                CompetitionScoreTopic t = topicRepository.findById(topicId).orElse(null);
                if (t == null || !t.getAssessmentDayId().equals(step.getAssessmentDay().getId())) {
                    return error(HttpStatus.BAD_REQUEST, "Nhóm điểm không thuộc ngày của bài thi");
                }
            }
            step.setTopicId(topicId);
        }
        stepRepository.save(step);
        return stepConfig(stepId);
    }

    /** The fault reasons stored one per line, as a list. */
    public static List<String> faultList(String stored) {
        if (stored == null || stored.isBlank()) return List.of();
        return java.util.Arrays.stream(stored.split("\n")).map(String::trim).filter(x -> !x.isEmpty()).toList();
    }

    /** body: { direction?, plausibleMin?, plausibleMax?, tolerance?, valueType?, faultReasons?: [..] }; a key with null clears that bound. */
    @PutMapping("/assessments/{assessmentId}/combine-config")
    @Transactional
    public ResponseEntity<?> updateAssessmentConfig(@PathVariable Long assessmentId, @RequestBody Map<String, Object> body) {
        CompetitionAssessment a = assessmentRepository.findById(assessmentId).orElse(null);
        if (a == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy nội dung thi");
        try {
            if (body.get("direction") != null) a.setDirection(ValueDirection.valueOf(body.get("direction").toString()));
            if (body.containsKey("plausibleMin")) a.setPlausibleMin(decimal(body.get("plausibleMin")));
            if (body.containsKey("plausibleMax")) a.setPlausibleMax(decimal(body.get("plausibleMax")));
            if (body.containsKey("tolerance")) a.setTolerance(decimal(body.get("tolerance")));
        } catch (IllegalArgumentException e) {
            return error(HttpStatus.BAD_REQUEST, "Giá trị không hợp lệ");
        }
        if (body.containsKey("faultReasons")) {
            List<String> reasons = body.get("faultReasons") instanceof List<?> l
                    ? l.stream().map(String::valueOf).map(String::trim).filter(x -> !x.isEmpty()).distinct().limit(8).toList() : List.of();
            String joined = String.join("\n", reasons);
            if (joined.length() > 500) return error(HttpStatus.BAD_REQUEST, "Danh sách lỗi quá dài");
            a.setFaultReasons(joined.isEmpty() ? null : joined);
        }
        if (body.get("valueType") != null) {
            String vt = body.get("valueType").toString();
            if (!VALUE_TYPES.contains(vt)) return error(HttpStatus.BAD_REQUEST, "Kiểu giá trị không hợp lệ");
            a.setValueType(vt);
        }
        if (a.getPlausibleMin() != null && a.getPlausibleMax() != null && a.getPlausibleMin().compareTo(a.getPlausibleMax()) > 0) {
            return error(HttpStatus.BAD_REQUEST, "Ngưỡng hợp lý: cận dưới lớn hơn cận trên");
        }
        assessmentRepository.save(a);
        return stepConfig(a.getAssessmentStep().getId());
    }

    @GetMapping("/assessment-days/{dayId}/topics")
    @PreAuthorize("hasAnyRole('EDITOR', 'ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<?> topics(@PathVariable Long dayId) {
        if (!dayRepository.existsById(dayId)) return error(HttpStatus.NOT_FOUND, "Không tìm thấy ngày thi");
        List<CompetitionScoreTopic> topics = topicRepository.findByAssessmentDayIdOrderByDisplayOrderAsc(dayId);
        BigDecimal sum = topics.stream().map(CompetitionScoreTopic::getMaxPoints).reduce(BigDecimal.ZERO, BigDecimal::add);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("topics", topics.stream().map(AdminCombineController::topic).toList());
        out.put("totalPoints", sum);
        out.put("warning", sum.compareTo(BigDecimal.valueOf(100)) == 0 ? null : "Tổng điểm các nhóm là " + sum.stripTrailingZeros().toPlainString() + ", chưa bằng 100");
        return ResponseEntity.ok(out);
    }

    /**
     * Replaces the day's topics. body: { topics: [{ id?, topicKey, name, maxPoints, tieBreakOrder? }] } in display order;
     * a topic left out is deleted and its steps lose their topic.
     */
    @PutMapping("/assessment-days/{dayId}/topics")
    @Transactional
    public ResponseEntity<?> saveTopics(@PathVariable Long dayId, @RequestBody Map<String, Object> body) {
        if (!dayRepository.existsById(dayId)) return error(HttpStatus.NOT_FOUND, "Không tìm thấy ngày thi");
        if (!(body.get("topics") instanceof List<?> list)) return error(HttpStatus.BAD_REQUEST, "Thiếu danh sách nhóm điểm");
        Map<Long, CompetitionScoreTopic> existing = topicRepository.findByAssessmentDayIdOrderByDisplayOrderAsc(dayId).stream()
                .collect(Collectors.toMap(CompetitionScoreTopic::getId, t -> t));
        Set<String> keys = new HashSet<>();
        Set<String> given = new HashSet<>(); // codes the request already uses, so a generated one never takes them
        for (Object o : list) if (o instanceof Map<?, ?> m && str(m.get("topicKey")) != null) given.add(str(m.get("topicKey")));
        List<CompetitionScoreTopic> keep = new ArrayList<>();
        int order = 0;
        for (Object o : list) {
            if (!(o instanceof Map<?, ?> m)) continue;
            String key = str(m.get("topicKey"));
            String name = str(m.get("name"));
            BigDecimal max = decimal(m.get("maxPoints"));
            if (name == null || max == null || max.signum() <= 0) {
                return error(HttpStatus.BAD_REQUEST, "Mỗi nhóm cần tên và điểm tối đa lớn hơn 0");
            }
            // The code is internal (formula, exports): a new group gets one from its name; an existing group keeps its own.
            if (key == null) {
                key = topicKeyOf(name, given);
                given.add(key);
            }
            if (!keys.add(key)) return error(HttpStatus.BAD_REQUEST, "Hai nhóm trùng mã " + key + ", hãy đổi tên một nhóm");
            Long id = longOf(m.get("id"));
            CompetitionScoreTopic t = id != null ? existing.remove(id) : null;
            if (id != null && t == null) return error(HttpStatus.BAD_REQUEST, "Nhóm " + id + " không thuộc ngày này");
            if (t == null) t = CompetitionScoreTopic.builder().assessmentDayId(dayId).build();
            t.setTopicKey(key);
            t.setName(name);
            t.setMaxPoints(max);
            t.setDisplayOrder(order++);
            t.setTieBreakOrder(m.get("tieBreakOrder") != null ? (int) num(m.get("tieBreakOrder")) : null);
            boolean prev = "PREV_DAY".equals(str(m.get("source")));
            Long sourceDay = prev ? longOf(m.get("sourceDayId")) : null;
            if (prev && (sourceDay == null || sourceDay.equals(dayId) || !dayRepository.existsById(sourceDay))) {
                return error(HttpStatus.BAD_REQUEST, "Nhóm “" + name + "” lấy điểm từ ngày trước: cần chọn một ngày khác");
            }
            t.setSource(prev ? "PREV_DAY" : null);
            t.setSourceDayId(sourceDay);
            keep.add(t);
        }
        if (!existing.isEmpty()) {
            for (CompetitionAssessmentStep s : stepRepository.findByAssessmentDayIdOrderByDisplayOrderAsc(dayId)) {
                if (s.getTopicId() != null && existing.containsKey(s.getTopicId())) {
                    s.setTopicId(null);
                    stepRepository.save(s);
                }
            }
            topicRepository.deleteAll(existing.values());
            topicRepository.flush();
        }
        topicRepository.saveAll(keep);
        return topics(dayId);
    }

    // ==================== SCORES ====================

    /** Day scores of every participant with results, best first; incomplete ones after the complete ones. */
    @GetMapping("/assessment-days/{dayId}/scores")
    @Transactional(readOnly = true)
    public ResponseEntity<?> dayScores(@PathVariable Long dayId, @RequestParam(required = false) Long participantId) {
        if (!dayRepository.existsById(dayId)) return error(HttpStatus.NOT_FOUND, "Không tìm thấy ngày thi");
        List<ScoringService.ParticipantDay> scores = new ArrayList<>(scoringService.scoreDay(dayId,
                participantId != null ? List.of(participantId) : null));
        scores.sort(Comparator.comparing(ScoringService.ParticipantDay::complete).reversed()
                .thenComparing(ScoringService.ParticipantDay::total, Comparator.reverseOrder()));
        Map<Long, String> names = names(scores.stream().map(ScoringService.ParticipantDay::participantId).toList());
        List<Map<String, Object>> out = new ArrayList<>();
        for (ScoringService.ParticipantDay d : scores) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("participantId", d.participantId());
            m.put("fullName", names.get(d.participantId()));
            m.put("goalkeeper", d.goalkeeper());
            m.put("total", d.total());
            m.put("complete", d.complete());
            m.put("topics", d.topics());
            m.put("steps", d.steps());
            out.add(m);
        }
        return ResponseEntity.ok(out);
    }

    // ==================== RECONCILIATION ====================

    /** Attempts waiting for a person on the day, oldest first, with every live raw record. */
    @GetMapping("/assessment-days/{dayId}/review")
    @Transactional(readOnly = true)
    public ResponseEntity<?> reviewQueue(@PathVariable Long dayId, @RequestParam(required = false) Long stepId) {
        if (!dayRepository.existsById(dayId)) return error(HttpStatus.NOT_FOUND, "Không tìm thấy ngày thi");
        Map<Long, CompetitionAssessment> assessments = new LinkedHashMap<>();
        Map<Long, CompetitionAssessmentStep> stepOf = new HashMap<>();
        for (CompetitionAssessmentStep s : stepRepository.findByAssessmentDayIdOrderByDisplayOrderAsc(dayId)) {
            if (stepId != null && !s.getId().equals(stepId)) continue;
            for (CompetitionAssessment a : assessmentRepository.findByAssessmentStepIdOrderByDisplayOrderAsc(s.getId())) {
                assessments.put(a.getId(), a);
                stepOf.put(a.getId(), s);
            }
        }
        if (assessments.isEmpty()) return ResponseEntity.ok(Map.of("items", List.of(), "counts", Map.of()));
        List<MeasurementOfficial> review = officialRepository.findByAssessmentIdInAndStateOrderByUpdatedAtAsc(assessments.keySet(), OfficialState.REVIEW);
        Map<Long, String> names = names(review.stream().map(MeasurementOfficial::getParticipantId).distinct().toList());
        List<Map<String, Object>> items = new ArrayList<>();
        for (MeasurementOfficial o : review) {
            CompetitionAssessment a = assessments.get(o.getAssessmentId());
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("officialId", o.getId());
            m.put("participantId", o.getParticipantId());
            m.put("fullName", names.get(o.getParticipantId()));
            m.put("stepId", stepOf.get(a.getId()).getId());
            m.put("stepTitle", stepOf.get(a.getId()).getTitle());
            m.put("assessmentId", a.getId());
            m.put("assessmentTitle", a.getTitle());
            m.put("unit", a.getUnit());
            m.put("attemptNumber", o.getAttemptNumber());
            m.put("reason", o.getReviewReason());
            m.put("pickedRawId", o.getRawId());
            m.put("records", measurementService.liveRecords(a.getId(), o.getParticipantId(), o.getAttemptNumber()).stream()
                    .map(AdminCombineController::raw).toList());
            items.add(m);
        }
        Map<String, Long> counts = new LinkedHashMap<>();
        for (OfficialState s : OfficialState.values()) counts.put(s.name(), officialRepository.countByAssessmentIdInAndState(assessments.keySet(), s));
        return ResponseEntity.ok(Map.of("items", items, "counts", counts));
    }

    /** Full history of one attempt, superseded records included. */
    @GetMapping("/measurements/history")
    @Transactional(readOnly = true)
    public ResponseEntity<?> history(@RequestParam Long assessmentId, @RequestParam Long participantId, @RequestParam Integer attempt) {
        List<MeasurementRaw> all = rawRepository.findByAssessmentIdAndParticipantIdAndAttemptNumberOrderByIdAsc(assessmentId, participantId, attempt);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("records", all.stream().map(AdminCombineController::raw).toList());
        out.put("official", officialRepository.findByAssessmentIdAndParticipantIdAndAttemptNumber(assessmentId, participantId, attempt).orElse(null));
        return ResponseEntity.ok(out);
    }

    /** body: { rawId } to pick a record, or { value, status? } to type the right one in; note is required. */
    @PostMapping("/measurements/official/{officialId}/resolve")
    public ResponseEntity<?> resolve(@PathVariable Long officialId, @RequestBody Map<String, Object> body) {
        MeasurementStatus status = null;
        if (body.get("status") != null) {
            try {
                status = MeasurementStatus.valueOf(body.get("status").toString());
            } catch (IllegalArgumentException e) {
                return error(HttpStatus.BAD_REQUEST, "Trạng thái không hợp lệ");
            }
        }
        try {
            return ResponseEntity.ok(measurementService.resolve(officialId, longOf(body.get("rawId")), decimal(body.get("value")),
                    status, str(body.get("note")), currentUserId()));
        } catch (IllegalArgumentException e) {
            return error(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PostMapping("/assessment-steps/{stepId}/lock")
    public ResponseEntity<?> lock(@PathVariable Long stepId) {
        try {
            measurementService.lockStep(stepId, currentUserId());
            // Closing a test is the moment the round score is stored again (ranking, Top 30 read the stored one).
            // Ids only: this controller has no open session, and getId() on a lazy proxy does not load it.
            stepRepository.findById(stepId)
                    .flatMap(st -> dayRepository.findById(st.getAssessmentDay().getId()))
                    .ifPresent(d -> roundScoringService.recompute(d.getStage().getId()));
            return ResponseEntity.ok(Map.of("message", "Đã khoá sổ bài thi, điểm vòng đã tính lại"));
        } catch (IllegalArgumentException e) {
            return error(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /** body: { reason }. Only an admin reopens a locked step. */
    @PostMapping("/assessment-steps/{stepId}/unlock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> unlock(@PathVariable Long stepId, @RequestBody Map<String, Object> body) {
        try {
            measurementService.unlockStep(stepId, currentUserId(), str(body.get("reason")));
            return ResponseEntity.ok(Map.of("message", "Đã mở khoá bài thi"));
        } catch (IllegalArgumentException e) {
            return error(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    // ==================== HELPERS ====================

    private static Map<String, Object> topic(CompetitionScoreTopic t) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", t.getId());
        m.put("topicKey", t.getTopicKey());
        m.put("name", t.getName());
        m.put("maxPoints", t.getMaxPoints());
        m.put("tieBreakOrder", t.getTieBreakOrder());
        m.put("source", t.getSource());
        m.put("sourceDayId", t.getSourceDayId());
        return m;
    }

    private static Map<String, Object> raw(MeasurementRaw r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", r.getId());
        m.put("value", r.getValue());
        m.put("status", r.getStatus());
        m.put("faultNote", r.getFaultNote());
        m.put("source", r.getSource());
        m.put("deviceId", r.getDeviceId());
        m.put("recordedBy", r.getRecordedBy());
        m.put("measuredAt", r.getMeasuredAt());
        m.put("receivedAt", r.getReceivedAt());
        m.put("evidenceUrl", r.getEvidenceUrl());
        m.put("supersedesId", r.getSupersedesId());
        m.put("reason", r.getReason());
        return m;
    }

    private Map<Long, String> names(Collection<Long> participantIds) {
        Map<Long, String> out = new HashMap<>();
        for (CompetitionParticipant p : participantRepository.findAllById(participantIds)) out.put(p.getId(), p.getUser().getFullName());
        return out;
    }

    private Long currentUserId() {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;
        return userRepository.findByUserid(auth.getName()).or(() -> userRepository.findByPhone(auth.getName()))
                .map(User::getId).orElse(null);
    }

    private static BigDecimal decimal(Object o) {
        if (o == null) return null;
        String s = o.toString().trim().replace(',', '.');
        if (s.isEmpty() || "null".equals(s)) return null;
        return new BigDecimal(s);
    }

    private static double num(Object o) {
        return o instanceof Number n ? n.doubleValue() : Double.parseDouble(o.toString());
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

    /** THE_LUC from "Thể lực"; THE_LUC_2 when taken. */
    private static String topicKeyOf(String name, Set<String> taken) {
        String base = java.text.Normalizer.normalize(name.replace('đ', 'd').replace('Đ', 'D'), java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "").toUpperCase().replaceAll("[^A-Z0-9]+", "_").replaceAll("^_+|_+$", "");
        if (base.isEmpty()) base = "NHOM";
        if (base.length() > 26) base = base.substring(0, 26);
        String key = base;
        for (int n = 2; taken.contains(key); n++) key = base + "_" + n;
        return key;
    }
}
