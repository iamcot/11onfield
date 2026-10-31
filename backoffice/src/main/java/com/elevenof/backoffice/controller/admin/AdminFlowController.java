package com.elevenof.backoffice.controller.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Where a competition stands, step by step, for the bar on top of the competition screens: each step is done, needs
 * attention (with the reason) or not started, plus a short figure. Read-only counts over the tables the steps write.
 */
@RestController
@RequestMapping("/api/admin/competitions/{id}/flow")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'MEDICAL', 'HLV', 'TTV')")
public class AdminFlowController {

    private final JdbcTemplate jdbc;

    @GetMapping
    @Transactional(readOnly = true)
    public Map<String, Object> flow(@PathVariable Long id, @RequestParam(required = false) Integer stage) {
        Map<String, Map<String, String>> s = new LinkedHashMap<>();

        // ---- Chuẩn bị ----
        Map<String, Object> comp = jdbc.queryForList("SELECT title, competition_start_date FROM competitions WHERE id = ?", id)
                .stream().findFirst().orElse(Map.of());
        if (comp.get("title") != null && comp.get("competition_start_date") != null) put(s, "thong-tin", "done", null, null);
        else put(s, "thong-tin", "warn", "thiếu thông tin", "Giải chưa có ngày thi đấu.");

        // Same rule as the contestant list (SBD): enabled PLAYER with a verified profile, not withdrawn.
        long people = count("""
                SELECT COUNT(*) FROM competition_participants p JOIN users u ON u.id = p.user_id JOIN players pl ON pl.id = u.id
                WHERE p.competition_id = ? AND u.role = 'PLAYER' AND u.enabled = 1 AND pl.verified = 1 AND p.status <> 'WITHDRAWN'""", id);
        put(s, "thi-sinh", people > 0 ? "done" : "todo", people + " người", null);

        long rounds = count("SELECT COUNT(*) FROM competition_stages WHERE competition_id = ?", id);
        put(s, "danh-sach-vong", rounds > 0 ? "done" : "todo", rounds > 0 ? rounds + " vòng" : null, null);

        long hlv = count("SELECT COUNT(*) FROM competition_panel_members WHERE competition_id = ? AND panel_role = 'HLV'", id);
        long ttv = count("SELECT COUNT(*) FROM competition_panel_members WHERE competition_id = ? AND panel_role = 'TTV'", id);
        if (hlv > 0) put(s, "hoi-dong", "done", hlv + " HLV, " + ttv + " TTV", null);
        else if (ttv > 0) put(s, "hoi-dong", "warn", "chưa có HLV", "Hội đồng chưa có HLV. Cần ít nhất một HLV để chốt Top 30 và giữ Green Card.");
        else put(s, "hoi-dong", "todo", null, null);

        // ---- Theo vòng ----
        Map<String, Object> st = stage == null ? null : jdbc.queryForList(
                "SELECT id, status FROM competition_stages WHERE competition_id = ? AND stage_number = ?", id, stage)
                .stream().findFirst().orElse(null);
        if (st != null) roundSteps(s, ((Number) st.get("id")).longValue(), String.valueOf(st.get("status")), people);

        // ---- Sau khi thi, cả giải ----
        long lockedFormulas = count("SELECT COUNT(*) FROM score_formulas f JOIN competition_stages g ON g.id = f.stage_id "
                + "WHERE g.competition_id = ? AND f.locked_at IS NOT NULL", id);
        put(s, "xep-hang", lockedFormulas > 0 ? "done" : "todo", lockedFormulas > 0 ? "công thức đã khoá" : null, null);

        long top30 = count("SELECT COUNT(*) FROM selection_decisions WHERE competition_id = ? AND round_key = 'TOP30'", id);
        put(s, "top-30", top30 > 0 ? "done" : "todo", top30 > 0 ? "đã chốt" : null, null);

        long released = count("SELECT COUNT(*) FROM competition_stages WHERE competition_id = ? AND results_release_at IS NOT NULL", id);
        put(s, "phat-hanh", released > 0 ? "done" : "todo", released > 0 ? released + " vòng đã phát hành" : null, null);

        // ---- Nội dung giải (no state, just how many) ----
        put(s, "tin-tuc", null, count("SELECT COUNT(*) FROM competition_news WHERE competition_id = ?", id) + " bài", null);
        put(s, "nha-tai-tro", null, String.valueOf(count("SELECT COUNT(*) FROM competition_sponsors WHERE competition_id = ?", id)), null);

        return Map.of("steps", s);
    }

    private void roundSteps(Map<String, Map<String, String>> s, long stageId, String status, long people) {
        boolean started = "LIVE".equals(status) || "COMPLETED".equals(status);
        boolean over = "COMPLETED".equals(status);

        // Scored problems, and those that cannot be scored yet (no contents or no 5-level scale).
        List<Map<String, Object>> problems = jdbc.queryForList("""
                SELECT st.id,
                       (SELECT COUNT(*) FROM competition_assessments a WHERE a.assessment_step_id = st.id) AS contents,
                       (SELECT COUNT(*) FROM competition_assessment_step_ratings r WHERE r.assessment_step_id = st.id) AS levels,
                       (SELECT COUNT(*) FROM assessment_locks l WHERE l.step_id = st.id AND l.unlocked_at IS NULL) AS locked
                FROM competition_assessment_steps st
                JOIN competition_assessment_days d ON d.id = st.assessment_day_id
                WHERE d.stage_id = ? AND (st.is_scored IS NULL OR st.is_scored = 1)""", stageId);
        long noScale = problems.stream().filter(p -> num(p.get("contents")) == 0 || num(p.get("levels")) == 0).count();
        if (problems.isEmpty()) put(s, "bai-thi", "todo", "chưa có bài", null);
        else if (noScale > 0) put(s, "bai-thi", "warn", noScale + " bài chưa có thang",
                noScale + " bài thi tính điểm chưa có nội dung hoặc chưa có thang 5 mức.");
        else put(s, "bai-thi", "done", problems.size() + " bài", null);

        put(s, "kich-hoat", started ? "done" : "todo", over ? "đã kết thúc" : started ? "đang diễn ra" : null, null);

        long checked = count("SELECT COUNT(*) FROM stage_checkins WHERE stage_id = ?", stageId);
        put(s, "check-in", over && checked > 0 ? "done" : "todo", checked + "/" + people, null);

        long measured = count("""
                SELECT COUNT(*) FROM measurement_official o
                JOIN competition_assessments a ON a.id = o.assessment_id
                JOIN competition_assessment_steps st ON st.id = a.assessment_step_id
                JOIN competition_assessment_days d ON d.id = st.assessment_day_id
                WHERE d.stage_id = ?""", stageId);
        put(s, "cham-diem", over && measured > 0 ? "done" : "todo", measured > 0 ? measured + " lượt đo" : null, null);

        long notes = count("""
                SELECT COUNT(*) FROM judge_notes n
                JOIN competition_assessment_steps st ON st.id = n.step_id
                JOIN competition_assessment_days d ON d.id = st.assessment_day_id
                WHERE d.stage_id = ?""", stageId)
                + count("SELECT COUNT(*) FROM participant_flags WHERE stage_id = ? AND revoked_at IS NULL", stageId);
        put(s, "ghi-nhan", notes > 0 ? "done" : "todo", notes > 0 ? String.valueOf(notes) : null, null);

        long review = count("""
                SELECT COUNT(*) FROM measurement_official o
                JOIN competition_assessments a ON a.id = o.assessment_id
                JOIN competition_assessment_steps st ON st.id = a.assessment_step_id
                JOIN competition_assessment_days d ON d.id = st.assessment_day_id
                WHERE d.stage_id = ? AND o.state = 'REVIEW'""", stageId);
        boolean allLocked = !problems.isEmpty() && problems.stream().allMatch(p -> num(p.get("locked")) > 0);
        if (review > 0) put(s, "doi-soat", "warn", review + " cần xem", review + " lượt đo ngoài ngưỡng hoặc lệch nguồn đang chờ người xem.");
        else if (allLocked) put(s, "doi-soat", "done", "đã khoá sổ", null);
        else put(s, "doi-soat", "todo", null, null);

        long scored = count("SELECT COUNT(*) FROM score_snapshots WHERE stage_id = ?", stageId);
        put(s, "ket-qua", scored > 0 ? "done" : "todo", scored > 0 ? scored + " thí sinh" : null, null);
    }

    private long count(String sql, Object... args) {
        Long n = jdbc.queryForObject(sql, Long.class, args);
        return n == null ? 0 : n;
    }

    private static long num(Object o) {
        return o instanceof Number n ? n.longValue() : 0;
    }

    private static void put(Map<String, Map<String, String>> s, String step, String state, String meta, String warn) {
        Map<String, String> m = new LinkedHashMap<>();
        if (state != null) m.put("state", state);
        if (meta != null) m.put("meta", meta);
        if (warn != null) m.put("warn", warn);
        s.put(step, m);
    }
}
