package com.elevenof.backoffice.controller.admin;

import com.elevenof.backoffice.model.*;
import com.elevenof.backoffice.repository.*;
import com.elevenof.backoffice.scoring.ScoringEngine;
import com.elevenof.backoffice.service.CompetitionAssessmentResultService;
import com.elevenof.backoffice.service.MeasurementService;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * JSON API behind the Next.js admin (/quan-tri) for competitions, stages, contestants, field scoring and Excel export.
 * Assessment structure, stage results and TOP 30/11 selection live in CompetitionAssessmentController / AdminCompetitionController,
 * which are also mapped under /api/admin/competitions.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('EDITOR', 'ADMIN')")
public class AdminCompetitionApiController {

    private static final String MANAGER = "hasRole('ADMIN')";
    private static final String SCORER = "hasAnyRole('HLV', 'TTV', 'ADMIN')";

    private final CompetitionRepository competitionRepository;
    private final CompetitionStageRepository stageRepository;
    private final CompetitionParticipantRepository participantRepository;
    private final CompetitionNewsRepository newsRepository;
    private final CompetitionSponsorRepository sponsorRepository;
    private final CompetitionAssessmentDayRepository dayRepository;
    private final CompetitionAssessmentStepRepository stepRepository;
    private final CompetitionAssessmentRepository assessmentRepository;
    private final CompetitionAssessmentResultRepository resultRepository;
    private final CompetitionAssessmentResultService assessmentResultService;
    private final StageResultRepository stageResultRepository;
    private final CompetitionAssessmentStepScoreRepository stepScoreRepository;
    private final AdminController legacyAdminController;
    private final PlayerRepository playerRepository;
    private final UserRepository userRepository;
    private final com.elevenof.backoffice.service.StageCheckinService checkinService;
    private final com.elevenof.backoffice.service.MeasurementService measurementService;
    private final com.elevenof.backoffice.service.ParticipantFlagService flagService;
    private final com.elevenof.backoffice.service.ScoringService scoringService;
    private final CompetitionAssessmentStepRatingRepository ratingRepository;
    private final com.elevenof.backoffice.service.VisibilityService visibilityService;
    private final org.springframework.jdbc.core.JdbcTemplate jdbc;

    // ==================== COMPETITIONS ====================

    @GetMapping("/competitions")
    @PreAuthorize("hasAnyRole('EDITOR', 'ADMIN')")
    public List<Map<String, Object>> competitions() {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Competition c : competitionRepository.findAll()) {
            Map<String, Object> m = summary(c);
            m.put("participantCount", participantRepository.countByCompetitionId(c.getId()));
            m.put("stageCount", stageRepository.countByCompetitionId(c.getId()));
            out.add(m);
        }
        out.sort((a, b) -> Integer.compare(num(b.get("season")), num(a.get("season"))));
        return out;
    }

    @GetMapping("/competitions/{id}")
    public ResponseEntity<?> competition(@PathVariable Long id) {
        Competition c = competitionRepository.findById(id).orElse(null);
        if (c == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy giải đấu");
        Map<String, Object> m = summary(c);
        m.put("description", c.getDescription());
        m.put("participantCount", participantRepository.countByCompetitionId(id));
        m.put("stageCount", stageRepository.countByCompetitionId(id));
        m.put("newsCount", newsRepository.countByCompetitionId(id));
        m.put("sponsorCount", sponsorRepository.countByCompetitionId(id));
        m.put("datesLocked", !isNotStarted(c));
        return ResponseEntity.ok(m);
    }

    @PutMapping("/competitions/{id}")
    @PreAuthorize(MANAGER)
    public ResponseEntity<?> updateCompetition(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Competition c = competitionRepository.findById(id).orElse(null);
        if (c == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy giải đấu");
        String title = str(body.get("title"));
        if (title == null) return error(HttpStatus.BAD_REQUEST, "Tên giải đấu không được để trống");
        c.setTitle(title);
        c.setDescription(str(body.get("description")));
        String status = str(body.get("status"));
        if (status != null) {
            try {
                c.setStatus(CompetitionStatus.valueOf(status));
            } catch (IllegalArgumentException e) {
                return error(HttpStatus.BAD_REQUEST, "Trạng thái không hợp lệ");
            }
        }
        try {
            // Same rule as the old admin: start dates are frozen once the competition has begun; the end date is always editable.
            if (isNotStarted(c)) {
                if (str(body.get("registrationStartDate")) != null) c.setRegistrationStartDate(LocalDate.parse(str(body.get("registrationStartDate"))));
                if (str(body.get("registrationEndDate")) != null) c.setRegistrationEndDate(LocalDate.parse(str(body.get("registrationEndDate"))));
                if (str(body.get("competitionStartDate")) != null) c.setCompetitionStartDate(LocalDate.parse(str(body.get("competitionStartDate"))));
            }
            if (str(body.get("competitionEndDate")) != null) c.setCompetitionEndDate(LocalDate.parse(str(body.get("competitionEndDate"))));
        } catch (Exception e) {
            return error(HttpStatus.BAD_REQUEST, "Ngày không hợp lệ");
        }
        competitionRepository.save(c);
        return competition(id);
    }

    // ==================== STAGES ====================

    @GetMapping("/competitions/{id}/stages")
    @Transactional(readOnly = true)
    public ResponseEntity<?> stages(@PathVariable Long id) {
        Competition c = competitionRepository.findById(id).orElse(null);
        if (c == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy giải đấu");
        List<CompetitionStage> stages = stageRepository.findByCompetitionIdOrderByStageNumberAsc(id);

        Integer live = null;
        Integer nextUpcoming = null;
        for (CompetitionStage s : stages) if (s.getStatus() == StageStatus.LIVE) { live = s.getStageNumber(); break; }
        for (CompetitionStage s : stages) {
            if (s.getStatus() == StageStatus.UPCOMING && (live == null || s.getStageNumber() > live)) { nextUpcoming = s.getStageNumber(); break; }
        }

        List<Map<String, Object>> items = new ArrayList<>();
        for (CompetitionStage s : stages) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", s.getId());
            m.put("stageNumber", s.getStageNumber());
            m.put("title", s.getTitle());
            m.put("description", s.getDescription());
            m.put("stageDate", s.getStageDate() != null ? s.getStageDate().toString() : null);
            m.put("stageTime", s.getStageTime());
            m.put("stageType", s.getStageType() != null ? s.getStageType().name() : null);
            m.put("region", s.getRegion() != null ? s.getRegion().name() : null);
            m.put("status", s.getStatus() != null ? s.getStatus().name() : null);
            m.put("isPublicScoring", Boolean.TRUE.equals(s.getIsPublicScoring()));
            int days = 0, steps = 0, assessments = 0;
            for (CompetitionAssessmentDay d : dayRepository.findByStageIdOrderByDisplayOrderAsc(s.getId())) {
                days++;
                for (CompetitionAssessmentStep st : stepRepository.findByAssessmentDayIdOrderByDisplayOrderAsc(d.getId())) {
                    steps++;
                    assessments += (int) assessmentRepository.countByAssessmentStepId(st.getId());
                }
            }
            m.put("daysCount", days);
            m.put("stepsCount", steps);
            m.put("assessmentsCount", assessments);
            items.add(m);
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("competition", summary(c));
        out.put("liveStageNumber", live);
        out.put("nextUpcomingStageNumber", nextUpcoming);
        out.put("stages", items);
        return ResponseEntity.ok(out);
    }

    /** Creates a stage. stageDate may be empty: the website then shows "Đang cập nhật". */
    @PostMapping("/competitions/{id}/stages")
    @PreAuthorize(MANAGER)
    public ResponseEntity<?> createStage(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Competition c = competitionRepository.findById(id).orElse(null);
        if (c == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy giải đấu");
        String title = str(body.get("title"));
        if (title == null) return error(HttpStatus.BAD_REQUEST, "Tên vòng thi không được để trống");
        StageType type;
        Region region = null;
        try {
            type = StageType.valueOf(str(body.get("stageType")));
            if (str(body.get("region")) != null) region = Region.valueOf(str(body.get("region")));
        } catch (Exception e) {
            return error(HttpStatus.BAD_REQUEST, "Loại vòng hoặc khu vực không hợp lệ");
        }
        LocalDate date = null;
        try {
            if (str(body.get("stageDate")) != null) date = LocalDate.parse(str(body.get("stageDate")));
        } catch (Exception e) {
            return error(HttpStatus.BAD_REQUEST, "Ngày không hợp lệ");
        }
        int next = stageRepository.findByCompetitionIdOrderByStageNumberAsc(id).stream()
                .mapToInt(CompetitionStage::getStageNumber).max().orElse(0) + 1;
        Boolean pub = body.get("isPublicScoring") instanceof Boolean b ? b : type != StageType.TRAINING_EPISODE;
        CompetitionStage s = CompetitionStage.builder()
                .competition(c).stageNumber(next).title(title).description(str(body.get("description")))
                .stageDate(date).stageTime(str(body.get("stageTime"))).stageType(type).region(region)
                .status(StageStatus.UPCOMING).isPublicScoring(pub).build();
        stageRepository.save(s);
        return ResponseEntity.ok(Map.of("stageNumber", next, "message", "Đã tạo vòng thi"));
    }

    @PutMapping("/competitions/{id}/stages/{n}")
    @PreAuthorize(MANAGER)
    public ResponseEntity<?> updateStage(@PathVariable Long id, @PathVariable Integer n, @RequestBody Map<String, Object> body) {
        CompetitionStage s = stageRepository.findByCompetitionIdAndStageNumber(id, n).orElse(null);
        if (s == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy vòng thi");
        String title = str(body.get("title"));
        if (title == null) return error(HttpStatus.BAD_REQUEST, "Tên vòng thi không được để trống");
        try {
            s.setStageDate(str(body.get("stageDate")) != null ? LocalDate.parse(str(body.get("stageDate"))) : null);
        } catch (Exception e) {
            return error(HttpStatus.BAD_REQUEST, "Ngày không hợp lệ");
        }
        s.setTitle(title);
        s.setDescription(str(body.get("description")));
        s.setStageTime(str(body.get("stageTime")));
        if (body.get("isPublicScoring") instanceof Boolean b) s.setIsPublicScoring(b);
        stageRepository.save(s);
        return ResponseEntity.ok(Map.of("message", "Đã lưu vòng thi"));
    }

    @PostMapping("/competitions/{id}/stages/{n}/activate")
    @PreAuthorize(MANAGER)
    public ResponseEntity<?> activate(@PathVariable Long id, @PathVariable Integer n) {
        return wrap(legacyAdminController.activateStage(id, n));
    }

    @PostMapping("/competitions/{id}/stages/{n}/deactivate")
    @PreAuthorize(MANAGER)
    public ResponseEntity<?> deactivate(@PathVariable Long id, @PathVariable Integer n) {
        return wrap(legacyAdminController.deactivateStage(id, n));
    }

    // ==================== VISIBILITY ====================

    /** Visibility grid of a competition (stageId empty) or of one round; groups without a saved row show the default. */
    @GetMapping("/competitions/{id}/visibility")
    @PreAuthorize(MANAGER)
    public Map<String, Object> visibility(@PathVariable Long id, @RequestParam(required = false) Long stageId) {
        List<Map<String, Object>> rows = new ArrayList<>();
        for (VisibilityPolicy p : visibilityService.policies(id, stageId)) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("dataGroup", p.getDataGroup().name());
            m.put("maxLevel", p.getMaxLevel().name());
            m.put("ownerCanHide", p.getOwnerCanHide());
            m.put("locked", p.getDataGroup().locked);
            m.put("canOwnerHide", p.getDataGroup().ownerCanHide);
            m.put("gated", p.getDataGroup().gated);
            m.put("defaultLevel", p.getDataGroup().defaultLevel.name());
            rows.add(m);
        }
        List<Map<String, Object>> stages = new ArrayList<>();
        for (CompetitionStage s : stageRepository.findByCompetitionIdOrderByStageNumberAsc(id)) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", s.getId());
            m.put("stageNumber", s.getStageNumber());
            m.put("title", s.getTitle());
            m.put("resultsReleaseAt", s.getResultsReleaseAt());
            stages.add(m);
        }
        return Map.of("policies", rows, "stages", stages);
    }

    @PutMapping("/competitions/{id}/visibility")
    @PreAuthorize(MANAGER)
    public ResponseEntity<?> saveVisibility(@PathVariable Long id, @RequestParam(required = false) Long stageId, @RequestBody Map<String, Object> body) {
        try {
            visibilityService.savePolicy(id, stageId, DataGroup.valueOf(str(body.get("dataGroup"))),
                VisibilityLevel.valueOf(str(body.get("maxLevel"))), !Boolean.FALSE.equals(body.get("ownerCanHide")));
        } catch (IllegalArgumentException | NullPointerException e) {
            return error(HttpStatus.BAD_REQUEST, e.getMessage() != null ? e.getMessage() : "Dữ liệu không hợp lệ");
        }
        return ResponseEntity.ok(Map.of("message", "Đã lưu"));
    }

    /** Releases the round's results now, or at {@code releaseAt} (ISO local date-time); {@code release=false} takes them back. */
    @PostMapping("/competitions/{id}/stages/{n}/release")
    @PreAuthorize(MANAGER)
    public ResponseEntity<?> releaseResults(@PathVariable Long id, @PathVariable Integer n, @RequestBody(required = false) Map<String, Object> body) {
        try {
            java.time.LocalDateTime at = body != null && Boolean.FALSE.equals(body.get("release")) ? null
                : body != null && str(body.get("releaseAt")) != null ? java.time.LocalDateTime.parse(str(body.get("releaseAt")))
                : java.time.LocalDateTime.now();
            visibilityService.release(id, n, at);
            return ResponseEntity.ok(Map.of("message", at == null ? "Đã thu hồi kết quả" : "Đã phát hành kết quả", "resultsReleaseAt", at == null ? "" : at.toString()));
        } catch (java.time.format.DateTimeParseException e) {
            return error(HttpStatus.BAD_REQUEST, "Giờ phát hành không hợp lệ");
        } catch (IllegalArgumentException e) {
            return error(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    // ==================== CONTESTANTS ====================

    @GetMapping("/competitions/{id}/contestants")
    @Transactional(readOnly = true)
    public List<Map<String, Object>> contestants(@PathVariable Long id) {
        List<Map<String, Object>> out = new ArrayList<>();
        List<CompetitionParticipant> all = participantRepository.findByCompetitionIdWithUserOrderByRegistrationDate(id);
        Map<Long, Long> playerIds = new HashMap<>();
        playerRepository.findByUserIdIn(all.stream().map(p -> p.getUser().getId()).toList())
                .forEach(pl -> playerIds.put(pl.getUser().getId(), pl.getId()));
        Map<Long, Map<String, Object>> checkins = checkinService.latestByParticipant(id);
        for (int i = 0; i < all.size(); i++) {
            Map<String, Object> m = contestant(all.get(i), i + 1);
            m.put("playerId", playerIds.get(all.get(i).getUser().getId()));
            m.put("lastCheckin", checkins.get(all.get(i).getId()));
            out.add(m);
        }
        return out;
    }

    /** Players who can be added to the competition by hand (search by name or phone). */
    @GetMapping("/competitions/{id}/candidates")
    @PreAuthorize(MANAGER)
    @Transactional(readOnly = true)
    public List<Map<String, Object>> candidates(@PathVariable Long id, @RequestParam(defaultValue = "") String q) {
        String term = q.trim();
        if (term.length() < 2) return List.of();
        List<Map<String, Object>> out = new ArrayList<>();
        for (User u : userRepository.findCandidatesForCompetition(id, User.Role.PLAYER, term, PageRequest.of(0, 20))) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("userId", u.getId());
            m.put("fullName", u.getFullName());
            m.put("phone", u.getPhone());
            m.put("avatar", u.getAvatar());
            out.add(m);
        }
        return out;
    }

    /** Adds a player to the competition by hand, outside the registration window. */
    @PostMapping("/competitions/{id}/participants")
    @PreAuthorize(MANAGER)
    @Transactional
    public Map<String, Object> addParticipant(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Competition c = competitionRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy giải đấu."));
        Object rawUser = body.get("userId");
        if (rawUser == null) throw new IllegalArgumentException("Chưa chọn cầu thủ.");
        User user = userRepository.findById(Long.valueOf(rawUser.toString()))
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy cầu thủ."));
        if (user.getRole() != User.Role.PLAYER) throw new IllegalArgumentException("Tài khoản này không phải cầu thủ.");
        if (participantRepository.existsByCompetitionIdAndUserId(id, user.getId()))
            throw new IllegalArgumentException(user.getFullName() + " đã có trong giải đấu này.");
        Region region = null;
        Object rawRegion = body.get("region");
        if (rawRegion != null && !rawRegion.toString().isBlank()) {
            try { region = Region.valueOf(rawRegion.toString()); }
            catch (IllegalArgumentException e) { throw new IllegalArgumentException("Khu vực không hợp lệ."); }
        }
        CompetitionParticipant p = participantRepository.save(CompetitionParticipant.builder()
                .competition(c)
                .user(user)
                .enrollmentType(EnrollmentType.ADMIN_ADDED)
                .status(ParticipantStatus.REGISTERED)
                .selectedRegion(region)
                .registrationDate(java.time.LocalDateTime.now())
                .build());
        return Map.of("message", "Đã thêm " + user.getFullName() + " vào giải", "id", p.getId());
    }

    /** Takes a player out of the competition (WITHDRAWN). Scores, check-ins and the SBD stay, so it can be undone. */
    @PostMapping("/competitions/{id}/participants/{participantId}/withdraw")
    @PreAuthorize(MANAGER)
    @Transactional
    public Map<String, Object> withdrawParticipant(@PathVariable Long id, @PathVariable Long participantId) {
        CompetitionParticipant p = participantOf(id, participantId);
        if (p.getStatus() == ParticipantStatus.WITHDRAWN)
            throw new IllegalArgumentException(p.getUser().getFullName() + " đã ra khỏi giải.");
        p.setStatus(ParticipantStatus.WITHDRAWN);
        participantRepository.save(p);
        return Map.of("message", "Đã cho " + p.getUser().getFullName() + " ra khỏi giải");
    }

    /** Brings a withdrawn player back as REGISTERED. */
    @PostMapping("/competitions/{id}/participants/{participantId}/restore")
    @PreAuthorize(MANAGER)
    @Transactional
    public Map<String, Object> restoreParticipant(@PathVariable Long id, @PathVariable Long participantId) {
        CompetitionParticipant p = participantOf(id, participantId);
        if (p.getStatus() != ParticipantStatus.WITHDRAWN)
            throw new IllegalArgumentException(p.getUser().getFullName() + " đang có trong giải.");
        p.setStatus(ParticipantStatus.REGISTERED);
        participantRepository.save(p);
        return Map.of("message", "Đã đưa " + p.getUser().getFullName() + " trở lại giải");
    }

    private CompetitionParticipant participantOf(Long competitionId, Long participantId) {
        CompetitionParticipant p = participantRepository.findById(participantId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thí sinh."));
        if (!p.getCompetition().getId().equals(competitionId)) throw new IllegalArgumentException("Thí sinh không thuộc giải này.");
        return p;
    }

    // ==================== CHECK-IN (QR) ====================

    private static final String ANY_STAFF = "hasAnyRole('EDITOR', 'HLV', 'TTV', 'ADMIN')";

    @GetMapping("/checkin/stages")
    @PreAuthorize(ANY_STAFF)
    public List<Map<String, Object>> checkinStages() {
        return checkinService.stages();
    }

    /** Polled by the check-in screen: current QR (null when closed) and who checked in. */
    @GetMapping("/checkin/stages/{stageId}")
    @PreAuthorize(ANY_STAFF)
    public Map<String, Object> checkinStage(@PathVariable Long stageId) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("qr", checkinService.currentCode(stageId));
        out.put("windowSeconds", com.elevenof.backoffice.service.StageCheckinService.WINDOW_SECONDS);
        out.put("checkins", checkinService.checkins(stageId));
        return out;
    }

    @PostMapping("/checkin/stages/{stageId}/{action:open|close}")
    @PreAuthorize(MANAGER)
    public Map<String, String> checkinOpen(@PathVariable Long stageId, @PathVariable String action) {
        checkinService.setOpen(stageId, "open".equals(action));
        return Map.of("message", "open".equals(action) ? "Đã mở check-in" : "Đã đóng check-in");
    }

    private Map<String, Object> contestant(CompetitionParticipant p, int sbd) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.getId());
        m.put("sbd", sbd);
        m.put("userId", p.getUser().getId());
        m.put("fullName", p.getUser().getFullName());
        m.put("phone", p.getUser().getPhone());
        m.put("avatar", p.getUser().getAvatar());
        m.put("status", p.getStatus() != null ? p.getStatus().name() : null);
        m.put("region", p.getSelectedRegion() != null ? p.getSelectedRegion().name() : null);
        m.put("registrationDate", p.getRegistrationDate() != null ? p.getRegistrationDate().toString() : null);
        return m;
    }

    // ==================== FIELD SCORING ====================

    /** Everything the mobile scoring screen needs for the current selection (stage -> day -> step -> contestant by SBD). */
    @GetMapping("/field-scoring")
    @PreAuthorize(SCORER)
    @Transactional(readOnly = true)
    public Map<String, Object> fieldScoring(@RequestParam(required = false) Long dayId,
                                            @RequestParam(required = false) Long stepId,
                                            @RequestParam(required = false) String sbd,
                                            @RequestParam(required = false) Long participantId,
                                            @RequestParam(defaultValue = "0") int historyPage) {
        Map<String, Object> out = new LinkedHashMap<>();
        List<Competition> active = competitionRepository.findByStatusNotInOrderBySeasonDesc(
                List.of(CompetitionStatus.DRAFT, CompetitionStatus.COMPLETED));
        if (active.isEmpty()) return out;
        Competition c = active.get(0);
        out.put("competition", summary(c));

        CompetitionStage live = stageRepository.findByCompetitionIdOrderByStageNumberAsc(c.getId()).stream()
                .filter(s -> s.getStatus() == StageStatus.LIVE).findFirst().orElse(null);
        if (live == null) return out;
        out.put("stage", Map.of("id", live.getId(), "stageNumber", live.getStageNumber(), "title", live.getTitle()));

        List<CompetitionAssessmentDay> days = dayRepository.findByStageIdOrderByDisplayOrderAsc(live.getId());
        List<Map<String, Object>> dayList = new ArrayList<>();
        for (CompetitionAssessmentDay d : days) dayList.add(Map.of("id", d.getId(), "title", label(d.getDayNumber(), d.getTitle())));
        out.put("days", dayList);

        CompetitionAssessmentDay day = days.stream().filter(d -> d.getId().equals(dayId)).findFirst().orElse(null);
        if (day == null) return out;

        List<CompetitionAssessmentStep> steps = stepRepository.findByAssessmentDayIdOrderByDisplayOrderAsc(day.getId());
        List<Map<String, Object>> stepList = new ArrayList<>();
        for (CompetitionAssessmentStep s : steps) stepList.add(Map.of("id", s.getId(), "title", label(s.getStepNumber(), s.getTitle()), "scoreSource", s.getScoreSource()));
        out.put("steps", stepList);

        CompetitionAssessmentStep step = steps.stream().filter(s -> s.getId().equals(stepId)).findFirst().orElse(null);
        if (step == null) return out;

        List<CompetitionAssessment> assessments = assessmentRepository.findByAssessmentStepIdOrderByDisplayOrderAsc(step.getId());
        List<Map<String, Object>> assessmentList = new ArrayList<>();
        for (CompetitionAssessment a : assessments) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", a.getId());
            m.put("title", a.getTitle());
            m.put("unit", a.getUnit());
            m.put("attemptsCount", a.getAttemptsCount());
            m.put("scoringMethod", a.getScoringMethod() != null ? a.getScoringMethod().name() : null);
            assessmentList.add(m);
        }
        out.put("assessments", assessmentList);

        List<CompetitionParticipant> all = participantRepository.findByCompetitionIdWithUserOrderByRegistrationDate(c.getId());
        CompetitionParticipant picked = null;
        int pickedSbd = 0;
        if (participantId != null) {
            for (int i = 0; i < all.size(); i++) if (all.get(i).getId().equals(participantId)) { picked = all.get(i); pickedSbd = i + 1; }
        } else if (sbd != null && !sbd.isBlank()) {
            try {
                int n = Integer.parseInt(sbd.trim());
                if (n >= 1 && n <= all.size()) { picked = all.get(n - 1); pickedSbd = n; }
                else out.put("sbdError", "Không tìm thấy thí sinh với SBD: " + sbd.trim());
            } catch (NumberFormatException e) {
                out.put("sbdError", "SBD không hợp lệ");
            }
        }
        // A day with a list (top x of the day before plus exceptions) only takes the people on it.
        if (picked != null) {
            List<Long> listed = jdbc.queryForList("SELECT participant_id FROM day_participants WHERE day_id = ?", Long.class, day.getId());
            if (!listed.isEmpty() && !listed.contains(picked.getId())) {
                out.put("sbdError", "SBD " + pickedSbd + " không có trong danh sách thi ngày " + day.getDayNumber());
                picked = null;
            }
        }
        if (picked != null) {
            out.put("participant", contestant(picked, pickedSbd));
            out.put("blocked", flagService.isBlocked(picked.getId()));
            Map<String, BigDecimal> scores = new LinkedHashMap<>();
            for (CompetitionAssessment a : assessments) {
                for (CompetitionAssessmentResult r : resultRepository.findByAssessmentIdAndParticipantIdOrderByAttemptNumberAsc(a.getId(), picked.getId())) {
                    scores.put(a.getId() + "_" + r.getAttemptNumber(), r.getResultValue());
                }
            }
            out.put("scores", scores);
        }

        int size = 10;
        List<Long> ids = resultRepository.findDistinctParticipantIdsByStepId(step.getId(), PageRequest.of(Math.max(historyPage, 0), size));
        long total = resultRepository.countDistinctParticipantsByStepId(step.getId());
        long expected = assessments.stream().mapToLong(CompetitionAssessment::getAttemptsCount).sum();
        List<Map<String, Object>> history = new ArrayList<>();
        for (Long pid : ids) {
            for (int i = 0; i < all.size(); i++) {
                if (all.get(i).getId().equals(pid)) {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("sbd", i + 1);
                    m.put("participantId", pid);
                    m.put("fullName", all.get(i).getUser().getFullName());
                    m.put("filled", resultRepository.countFilledAssessmentsByStepAndParticipant(step.getId(), pid));
                    m.put("total", expected);
                    history.add(m);
                    break;
                }
            }
        }
        out.put("history", history);
        out.put("historyPage", historyPage);
        out.put("historyTotalPages", (int) Math.ceil((double) total / size));
        return out;
    }

    /**
     * body: { stepId, participantId, scores: { "<assessmentId>_<attempt>": value },
     *         statuses?: { "<assessmentId>_<attempt>": "FAULT" | "DNS" }, notes?: { key: text }, clientUuid? }.
     * Every number goes through MeasurementService as a raw record; unchanged attempts are skipped.
     * With clientUuid (one per save, from the offline queue) each attempt gets a UUID derived from "<clientUuid>:<key>" (same input, same UUID) so a resend is ignored.
     */
    @PostMapping("/field-scoring/save")
    @PreAuthorize(SCORER)
    public ResponseEntity<?> fieldScoringSave(@RequestBody Map<String, Object> body) {
        Long stepId = longOf(body.get("stepId"));
        Long participantId = longOf(body.get("participantId"));
        if (stepId == null || participantId == null) return error(HttpStatus.BAD_REQUEST, "Thiếu thông tin thí sinh hoặc bài thi");
        Map<?, ?> scores = body.get("scores") instanceof Map<?, ?> m ? m : Map.of();
        Map<?, ?> statuses = body.get("statuses") instanceof Map<?, ?> m ? m : Map.of();
        Map<?, ?> notes = body.get("notes") instanceof Map<?, ?> m ? m : Map.of();
        String clientUuid = str(body.get("clientUuid"));
        if (flagService.isBlocked(participantId)) return error(HttpStatus.CONFLICT, "Thí sinh đã bị bác sĩ loại khỏi vòng thi, không thể ghi điểm");
        // A coach's-score problem is entered by the head coach (or corrected by the admin), not by the scouts.
        CompetitionAssessmentStep scoredStep = stepRepository.findById(stepId).orElse(null);
        if (scoredStep != null && "HLV".equals(scoredStep.getScoreSource()) && !hasAuthority("ROLE_HLV") && !hasAuthority("ROLE_ADMIN")) {
            return error(HttpStatus.FORBIDDEN, "Bài này là Điểm HLV, chỉ HLV nhập");
        }
        Long userId = currentUserId();
        List<Map<String, Object>> review = new ArrayList<>();
        try {
            for (CompetitionAssessment a : assessmentRepository.findByAssessmentStepIdOrderByDisplayOrderAsc(stepId)) {
                for (int attempt = 1; attempt <= a.getAttemptsCount(); attempt++) {
                    String key = a.getId() + "_" + attempt;
                    MeasurementStatus status = MeasurementStatus.OK;
                    String statusText = str(statuses.get(key));
                    if (statusText != null) {
                        try {
                            status = MeasurementStatus.valueOf(statusText);
                        } catch (IllegalArgumentException e) {
                            return error(HttpStatus.BAD_REQUEST, "Trạng thái lượt không hợp lệ: " + statusText);
                        }
                    }
                    BigDecimal value = null;
                    if (status == MeasurementStatus.OK) {
                        String text = str(scores.get(key));
                        if (text == null) continue;
                        try {
                            value = new BigDecimal(text.replace(',', '.'));
                        } catch (NumberFormatException e) {
                            return error(HttpStatus.BAD_REQUEST, a.getTitle() + " lượt " + attempt + ": số không hợp lệ");
                        }
                    }
                    MeasurementService.RecordResult r = measurementService.recordFromTablet(a.getId(), participantId, attempt,
                            value, status, str(notes.get(key)), userId, clientUuid != null ? attemptUuid(clientUuid, key) : null);
                    if (r != null && r.official() != null && r.official().getState() == OfficialState.REVIEW) {
                        review.add(Map.of("key", key, "reason", String.valueOf(r.official().getReviewReason())));
                    }
                }
            }
            // Old-style steps keep their stored step score; combine steps are scored by ScoringService on read.
            try { assessmentResultService.calculateStepScore(stepId, participantId); } catch (Exception ignored) { }
            measurementService.applyLevelAction(stepId, participantId);
        } catch (IllegalArgumentException e) {
            return error(HttpStatus.BAD_REQUEST, e.getMessage());
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("message", review.isEmpty() ? "Đã lưu kết quả" : "Đã lưu, có " + review.size() + " lượt cần BTC xem lại");
        out.put("review", review);
        return ResponseEntity.ok(out);
    }

    /**
     * Every contestant of the day with the current value of each attempt of a step, for the table mode (catch-up at the
     * end of the day from the paper sheet). A day with a list only has the people on it; contestants a doctor took out
     * are marked blocked.
     */
    @GetMapping("/field-scoring/table")
    @PreAuthorize(SCORER)
    @Transactional(readOnly = true)
    public ResponseEntity<?> fieldScoringTable(@RequestParam Long stepId) {
        CompetitionAssessmentStep step = stepRepository.findById(stepId).orElse(null);
        if (step == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy bài thi");
        Long dayId = step.getAssessmentDay().getId();
        Long competitionId = step.getAssessmentDay().getStage().getCompetition().getId();
        List<CompetitionParticipant> all = participantRepository.findByCompetitionIdWithUserOrderByRegistrationDate(competitionId);
        Set<Long> listed = new HashSet<>(jdbc.queryForList("SELECT participant_id FROM day_participants WHERE day_id = ?", Long.class, dayId));
        Map<Long, Map<String, Object>> values = new HashMap<>();
        for (Map<String, Object> r : jdbc.queryForList("""
                SELECT o.participant_id, o.assessment_id, o.attempt_number, r.value, r.status, o.state
                FROM measurement_official o JOIN competition_assessments a ON a.id = o.assessment_id
                LEFT JOIN measurement_raw r ON r.id = o.raw_id
                WHERE a.assessment_step_id = ?""", stepId)) {
            Long pid = ((Number) r.get("participant_id")).longValue();
            String key = r.get("assessment_id") + "_" + r.get("attempt_number");
            Map<String, Object> v = values.computeIfAbsent(pid, k -> new LinkedHashMap<>(Map.of(
                    "scores", new LinkedHashMap<String, Object>(), "statuses", new LinkedHashMap<String, Object>(), "review", new ArrayList<String>())));
            @SuppressWarnings("unchecked") Map<String, Object> scores = (Map<String, Object>) v.get("scores");
            @SuppressWarnings("unchecked") Map<String, Object> statuses = (Map<String, Object>) v.get("statuses");
            @SuppressWarnings("unchecked") List<String> review = (List<String>) v.get("review");
            String status = r.get("status") == null ? "OK" : String.valueOf(r.get("status"));
            if ("OK".equals(status)) { if (r.get("value") != null) scores.put(key, r.get("value")); }
            else statuses.put(key, status);
            if ("REVIEW".equals(String.valueOf(r.get("state")))) review.add(key);
        }
        List<Map<String, Object>> rows = new ArrayList<>();
        for (int i = 0; i < all.size(); i++) {
            CompetitionParticipant cp = all.get(i);
            if (!listed.isEmpty() && !listed.contains(cp.getId())) continue;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("participantId", cp.getId());
            m.put("sbd", i + 1);
            m.put("fullName", cp.getUser().getFullName());
            m.put("blocked", flagService.isBlocked(cp.getId()));
            Map<String, Object> v = values.get(cp.getId());
            m.put("scores", v != null ? v.get("scores") : Map.of());
            m.put("statuses", v != null ? v.get("statuses") : Map.of());
            m.put("review", v != null ? v.get("review") : List.of());
            rows.add(m);
        }
        return ResponseEntity.ok(Map.of("rows", rows, "listed", !listed.isEmpty()));
    }

    /**
     * What the caller entered on this step, for the "Danh sách đã thi" drawer of the group entry screen: per contestant,
     * the caller's latest manual record of each attempt (value or FAULT / DNS), most recent contestant first.
     */
    @GetMapping("/field-scoring/mine")
    @PreAuthorize(SCORER)
    @Transactional(readOnly = true)
    public ResponseEntity<?> fieldScoringMine(@RequestParam Long stepId) {
        CompetitionAssessmentStep step = stepRepository.findById(stepId).orElse(null);
        if (step == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy bài thi");
        Long userId = currentUserId();
        if (userId == null) return error(HttpStatus.UNAUTHORIZED, "Chưa đăng nhập");
        Long competitionId = step.getAssessmentDay().getStage().getCompetition().getId();
        List<CompetitionParticipant> all = participantRepository.findByCompetitionIdWithUserOrderByRegistrationDate(competitionId);
        Map<Long, Integer> sbdOf = new HashMap<>();
        Map<Long, CompetitionParticipant> byId = new HashMap<>();
        for (int i = 0; i < all.size(); i++) { sbdOf.put(all.get(i).getId(), i + 1); byId.put(all.get(i).getId(), all.get(i)); }

        // Oldest first, so a later record of the same attempt (a correction) overwrites the earlier one.
        List<Map<String, Object>> raws = jdbc.queryForList("""
                SELECT r.participant_id, r.assessment_id, r.attempt_number, r.value, r.status, r.id
                FROM measurement_raw r JOIN competition_assessments a ON a.id = r.assessment_id
                WHERE a.assessment_step_id = ? AND r.recorded_by = ? AND r.source = 'MANUAL'
                ORDER BY r.id""", stepId, userId);
        Map<Long, Map<String, Object>> rows = new LinkedHashMap<>();
        Map<Long, Long> lastId = new HashMap<>();
        for (Map<String, Object> r : raws) {
            Long pid = ((Number) r.get("participant_id")).longValue();
            String key = r.get("assessment_id") + "_" + r.get("attempt_number");
            Map<String, Object> row = rows.computeIfAbsent(pid, k -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("participantId", k);
                m.put("sbd", sbdOf.get(k));
                CompetitionParticipant cp = byId.get(k);
                m.put("fullName", cp != null ? cp.getUser().getFullName() : null);
                m.put("scores", new LinkedHashMap<String, Object>());
                m.put("statuses", new LinkedHashMap<String, Object>());
                return m;
            });
            @SuppressWarnings("unchecked") Map<String, Object> scores = (Map<String, Object>) row.get("scores");
            @SuppressWarnings("unchecked") Map<String, Object> statuses = (Map<String, Object>) row.get("statuses");
            String status = String.valueOf(r.get("status"));
            if ("OK".equals(status)) { scores.put(key, r.get("value")); statuses.remove(key); }
            else { statuses.put(key, status); scores.remove(key); }
            lastId.put(pid, ((Number) r.get("id")).longValue());
        }
        List<Map<String, Object>> out = new ArrayList<>(rows.values());
        out.sort((a, b) -> Long.compare(lastId.get((Long) b.get("participantId")), lastId.get((Long) a.get("participantId"))));
        return ResponseEntity.ok(Map.of("rows", out));
    }

    /** Level the entered values would get, without saving. body: { stepId, scores: { "<assessmentId>_<attempt>": value } } */
    @PostMapping("/field-scoring/preview")
    @PreAuthorize(SCORER)
    @Transactional(readOnly = true)
    public ResponseEntity<?> fieldScoringPreview(@RequestBody Map<String, Object> body) {
        Long stepId = longOf(body.get("stepId"));
        if (stepId == null) return error(HttpStatus.BAD_REQUEST, "Thiếu bài thi");
        Map<?, ?> scores = body.get("scores") instanceof Map<?, ?> m ? m : Map.of();
        Map<Long, List<BigDecimal>> values = new HashMap<>();
        List<Map<String, Object>> warnings = new ArrayList<>();
        for (CompetitionAssessment a : assessmentRepository.findByAssessmentStepIdOrderByDisplayOrderAsc(stepId)) {
            List<BigDecimal> attempts = new ArrayList<>();
            for (int attempt = 1; attempt <= a.getAttemptsCount(); attempt++) {
                String text = str(scores.get(a.getId() + "_" + attempt));
                if (text == null) continue;
                try {
                    BigDecimal v = new BigDecimal(text.replace(',', '.'));
                    attempts.add(v);
                    if ((a.getPlausibleMin() != null && v.compareTo(a.getPlausibleMin()) < 0)
                            || (a.getPlausibleMax() != null && v.compareTo(a.getPlausibleMax()) > 0)) {
                        warnings.add(Map.of("key", a.getId() + "_" + attempt, "message", a.getTitle() + ": ngoài ngưỡng hợp lý "
                                + a.getPlausibleMin() + "–" + a.getPlausibleMax()));
                    }
                } catch (NumberFormatException ignored) {
                }
            }
            values.put(a.getId(), attempts);
        }
        ScoringEngine.Rating rating = scoringService.preview(stepId, values);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("level", rating != null ? rating.level() : null);
        out.put("perAssessment", rating != null ? rating.perAssessment() : Map.of());
        out.put("color", rating != null ? ratingRepository.findByAssessmentStepIdAndLevel(stepId, rating.level())
                .map(CompetitionAssessmentStepRating::getColor).orElse(null) : null);
        out.put("warnings", warnings);
        return ResponseEntity.ok(out);
    }

    private static boolean hasAuthority(String authority) {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals(authority));
    }

    private Long currentUserId() {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;
        // JWT puts the userid in the principal, the old form login the phone.
        return userRepository.findByUserid(auth.getName()).or(() -> userRepository.findByPhone(auth.getName()))
                .map(User::getId).orElse(null);
    }

    // ==================== EXCEL EXPORT ====================

    @GetMapping("/competitions/{id}/export/participants")
    @PreAuthorize(MANAGER)
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> exportParticipants(@PathVariable Long id) throws Exception {
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Thí sinh");
            header(wb, sheet, "SBD", "Họ tên", "Số điện thoại", "Email", "Khu vực", "Trạng thái", "Ngày đăng ký");
            List<CompetitionParticipant> all = participantRepository.findByCompetitionIdWithUserOrderByRegistrationDate(id);
            for (int i = 0; i < all.size(); i++) {
                CompetitionParticipant p = all.get(i);
                row(sheet, i + 1, i + 1, p.getUser().getFullName(), p.getUser().getPhone(), p.getUser().getEmail(),
                        p.getSelectedRegion() != null ? p.getSelectedRegion().name() : "",
                        p.getStatus() != null ? p.getStatus().name() : "",
                        p.getRegistrationDate() != null ? p.getRegistrationDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) : "");
            }
            widths(sheet, 7);
            return xlsx(wb, "thi-sinh-" + id + ".xlsx");
        }
    }

    @GetMapping("/competitions/{id}/export/results")
    @PreAuthorize(MANAGER)
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> exportResults(@PathVariable Long id) throws Exception {
        List<CompetitionParticipant> all = participantRepository.findByCompetitionIdWithUserOrderByRegistrationDate(id);
        Map<Long, Integer> sbd = new HashMap<>();
        for (int i = 0; i < all.size(); i++) sbd.put(all.get(i).getId(), i + 1);
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            List<CompetitionStage> stages = stageRepository.findByCompetitionIdOrderByStageNumberAsc(id);
            if (stages.isEmpty()) wb.createSheet("Chưa có vòng thi");
            for (CompetitionStage s : stages) {
                Sheet sheet = wb.createSheet(("Vòng " + s.getStageNumber()));
                header(wb, sheet, "SBD", "Họ tên", "Số điện thoại", "Điểm", "Xếp hạng", "Nhận xét");
                int r = 1;
                for (StageResult res : stageResultRepository.findByStageIdOrderByRankPositionAsc(s.getId())) {
                    CompetitionParticipant p = res.getParticipant();
                    row(sheet, r++, sbd.getOrDefault(p.getId(), 0), p.getUser().getFullName(), p.getUser().getPhone(),
                            res.getScore() != null ? res.getScore().doubleValue() : "", res.getRankPosition() != null ? res.getRankPosition() : "",
                            res.getPerformanceNotes() != null ? res.getPerformanceNotes() : "");
                }
                widths(sheet, 6);
            }
            return xlsx(wb, "ket-qua-" + id + ".xlsx");
        }
    }

    /**
     * Minutes (biên bản) of one stage as Excel: one sheet per step (bài thi) with every attempt as recorded, the step score and
     * level. dayId narrows it to one day. The "who entered it" column is not exported: results do not store the recorder yet.
     */
    @GetMapping("/competitions/{id}/stages/{n}/export/minutes")
    @PreAuthorize(MANAGER)
    @Transactional(readOnly = true)
    public ResponseEntity<?> exportMinutes(@PathVariable Long id, @PathVariable Integer n, @RequestParam(required = false) Long dayId) throws Exception {
        CompetitionStage stage = stageRepository.findByCompetitionIdAndStageNumber(id, n).orElse(null);
        if (stage == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy vòng thi");
        List<CompetitionParticipant> all = participantRepository.findByCompetitionIdWithUserOrderByRegistrationDate(id);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        Set<String> usedNames = new HashSet<>();
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            CellStyle bold = wb.createCellStyle();
            Font font = wb.createFont();
            font.setBold(true);
            bold.setFont(font);
            for (CompetitionAssessmentDay day : dayRepository.findByStageIdOrderByDisplayOrderAsc(stage.getId())) {
                if (dayId != null && !dayId.equals(day.getId())) continue;
                for (CompetitionAssessmentStep step : stepRepository.findByAssessmentDayIdOrderByDisplayOrderAsc(day.getId())) {
                    List<CompetitionAssessment> assessments = assessmentRepository.findByAssessmentStepIdOrderByDisplayOrderAsc(step.getId());
                    Map<String, CompetitionAssessmentResult> raw = new HashMap<>();
                    for (CompetitionAssessmentResult r : resultRepository.findByAssessmentAssessmentStepId(step.getId())) {
                        raw.put(r.getAssessment().getId() + "_" + r.getParticipant().getId() + "_" + r.getAttemptNumber(), r);
                    }
                    Map<Long, CompetitionAssessmentStepScore> scores = new HashMap<>();
                    for (CompetitionAssessmentStepScore sc : stepScoreRepository.findByAssessmentStepId(step.getId())) scores.put(sc.getParticipant().getId(), sc);

                    Sheet sheet = wb.createSheet(sheetName(usedNames, "N" + day.getDayNumber() + " " + step.getTitle()));
                    Row title = sheet.createRow(0);
                    Cell tc = title.createCell(0);
                    tc.setCellValue("Biên bản vòng " + stage.getStageNumber() + " — " + label(day.getDayNumber(), day.getTitle()) + " — " + step.getTitle());
                    tc.setCellStyle(bold);
                    sheet.createRow(1).createCell(0).setCellValue("Ngày thi: " + (day.getAssessmentDate() != null ? day.getAssessmentDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "—"));

                    List<String> heads = new ArrayList<>(List.of("SBD", "Họ tên", "Số điện thoại"));
                    for (CompetitionAssessment a : assessments) {
                        for (int k = 1; k <= Math.max(a.getAttemptsCount() == null ? 1 : a.getAttemptsCount(), 1); k++) {
                            heads.add(a.getTitle() + (a.getUnit() != null && !a.getUnit().isBlank() ? " (" + a.getUnit() + ")" : "") + " — lần " + k);
                        }
                    }
                    heads.addAll(List.of("Điểm bài", "Mức", "Ghi chú", "Giờ ghi gần nhất"));
                    Row head = sheet.createRow(3);
                    for (int i = 0; i < heads.size(); i++) {
                        Cell c = head.createCell(i);
                        c.setCellValue(heads.get(i));
                        c.setCellStyle(bold);
                    }
                    int r = 4;
                    for (int i = 0; i < all.size(); i++) {
                        CompetitionParticipant p = all.get(i);
                        List<Object> vals = new ArrayList<>(List.of(i + 1, p.getUser().getFullName(), p.getUser().getPhone() == null ? "" : p.getUser().getPhone()));
                        boolean any = false;
                        StringBuilder notes = new StringBuilder();
                        java.time.LocalDateTime last = null;
                        for (CompetitionAssessment a : assessments) {
                            for (int k = 1; k <= Math.max(a.getAttemptsCount() == null ? 1 : a.getAttemptsCount(), 1); k++) {
                                CompetitionAssessmentResult res = raw.get(a.getId() + "_" + p.getId() + "_" + k);
                                if (res == null || res.getResultValue() == null) { vals.add(""); continue; }
                                any = true;
                                vals.add(res.getResultValue().doubleValue());
                                if (res.getNotes() != null && !res.getNotes().isBlank()) notes.append(a.getTitle()).append(" lần ").append(k).append(": ").append(res.getNotes()).append("; ");
                                java.time.LocalDateTime at = res.getRecordedAt() != null ? res.getRecordedAt() : res.getUpdatedAt();
                                if (at != null && (last == null || at.isAfter(last))) last = at;
                            }
                        }
                        CompetitionAssessmentStepScore sc = scores.get(p.getId());
                        if (!any && sc == null) continue;
                        vals.add(sc != null && sc.getTotalScore() != null ? sc.getTotalScore().doubleValue() : "");
                        vals.add(sc != null && sc.getRatingLevel() != null ? sc.getRatingLevel() : "");
                        if (sc != null && sc.getNotes() != null && !sc.getNotes().isBlank()) notes.append(sc.getNotes());
                        vals.add(notes.toString().trim());
                        vals.add(last != null ? last.format(fmt) : "");
                        row(sheet, r++, vals.toArray());
                    }
                    for (int i = 0; i < heads.size(); i++) sheet.setColumnWidth(i, i == 1 ? 9000 : i >= heads.size() - 2 ? 9000 : 4800);
                }
            }
            if (wb.getNumberOfSheets() == 0) wb.createSheet("Chưa có bài thi");
            return xlsx(wb, "bien-ban-" + id + "-vong-" + n + (dayId != null ? "-ngay-" + dayId : "") + ".xlsx");
        }
    }

    /** Excel sheet names: at most 31 characters, none of []:*?/\, unique within the workbook. */
    private static String sheetName(Set<String> used, String raw) {
        String base = raw.replaceAll("[\\[\\]:*?/\\\\]", " ").trim();
        if (base.length() > 28) base = base.substring(0, 28);
        String name = base;
        for (int i = 2; !used.add(name.toLowerCase()); i++) name = base + " " + i;
        return name;
    }

    private static void header(Workbook wb, Sheet sheet, String... names) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        style.setFont(font);
        Row row = sheet.createRow(0);
        for (int i = 0; i < names.length; i++) {
            Cell c = row.createCell(i);
            c.setCellValue(names[i]);
            c.setCellStyle(style);
        }
    }

    private static void row(Sheet sheet, int index, Object... values) {
        Row row = sheet.createRow(index);
        for (int i = 0; i < values.length; i++) {
            Object v = values[i];
            Cell c = row.createCell(i);
            if (v instanceof Number n) c.setCellValue(n.doubleValue());
            else c.setCellValue(v == null ? "" : v.toString());
        }
    }

    private static void widths(Sheet sheet, int cols) {
        for (int i = 0; i < cols; i++) sheet.setColumnWidth(i, i == 1 || i == 5 ? 9000 : 5200);
    }

    private static ResponseEntity<byte[]> xlsx(Workbook wb, String filename) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        wb.write(out);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(out.toByteArray());
    }

    // ==================== HELPERS ====================

    private static Map<String, Object> summary(Competition c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", c.getId());
        m.put("title", c.getTitle());
        m.put("season", c.getSeason());
        m.put("status", c.getStatus() != null ? c.getStatus().name() : null);
        m.put("currentPhase", c.getCurrentPhase());
        m.put("registrationStartDate", date(c.getRegistrationStartDate()));
        m.put("registrationEndDate", date(c.getRegistrationEndDate()));
        m.put("competitionStartDate", date(c.getCompetitionStartDate()));
        m.put("competitionEndDate", date(c.getCompetitionEndDate()));
        return m;
    }

    private static boolean isNotStarted(Competition c) {
        return c.getStatus() == CompetitionStatus.DRAFT || c.getStatus() == CompetitionStatus.REGISTRATION_OPEN;
    }

    private static String date(LocalDate d) {
        return d != null ? d.toString() : null;
    }

    private static String label(Integer number, String title) {
        return (number != null ? number + ". " : "") + (title != null ? title : "");
    }

    private static int num(Object o) {
        return o instanceof Number n ? n.intValue() : 0;
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

    /** Turns the old controller's plain-text reply into {message}. */
    private static ResponseEntity<?> wrap(ResponseEntity<String> r) {
        String text = r.getBody() != null ? r.getBody() : "";
        return ResponseEntity.status(r.getStatusCode()).body(Map.of("message", text));
    }

    /** A 36-character id per attempt of one save, the same on every resend (the column holds one UUID). */
    private static String attemptUuid(String clientUuid, String key) {
        return java.util.UUID.nameUUIDFromBytes((clientUuid + ":" + key).getBytes(java.nio.charset.StandardCharsets.UTF_8)).toString();
    }
}
