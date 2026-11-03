package com.elevenof.backoffice.service.quiz;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Numbers and the on/off switch of the quiz practice: rows `quiz/<key>` of configurations. One table, {@link #FIELDS},
 * drives reading, saving and the admin form. While `enabled` is 0 only ADMIN and EDITOR accounts see and play it.
 */
@Component
@RequiredArgsConstructor
public class QuizSettings {

    public record Field(String key, String label, int def, int min, int max) {}

    public static final List<Field> FIELDS = List.of(
            new Field("enabled", "Bật tính năng cho cầu thủ (0 = tắt, chỉ ADMIN/EDITOR thấy)", 0, 0, 1),
            new Field("seconds", "Số giây cho mỗi câu", 30, 10, 120),
            new Field("daily_rank_cap", "Số câu leo hạng tối đa mỗi ngày (0 = không giới hạn)", 50, 0, 1000),
            new Field("stars_per_rank", "Số sao để lên hạng", 5, 1, 20),
            new Field("no_repeat_days", "Không lặp câu đã gặp trong (ngày)", 30, 0, 365),
            new Field("diagram_every", "Leo hạng: ít nhất 1 câu có sơ đồ trong mỗi N câu (0 = tắt)", 5, 0, 20),
            new Field("mock_size", "Số câu của đề thử", 20, 5, 50),
            new Field("mock_minutes", "Thời gian làm đề thử (phút)", 15, 1, 90),
            new Field("board_enabled", "Hiện bảng xếp hạng", 1, 0, 1));

    private final JdbcTemplate jdbc;

    private static String key(String k) {
        return "quiz/" + k;
    }

    public int get(String k) {
        Field f = field(k);
        List<String> rows = jdbc.queryForList("SELECT config_value FROM configurations WHERE config_key = ?", String.class, key(k));
        if (rows.isEmpty()) return f.def();
        try {
            int v = Integer.parseInt(rows.get(0).trim());
            return v < f.min() || v > f.max() ? f.def() : v;
        } catch (NumberFormatException e) {
            return f.def();
        }
    }

    public boolean enabled() {
        return get("enabled") == 1;
    }

    public Map<String, Integer> all() {
        Map<String, Integer> out = new LinkedHashMap<>();
        for (Field f : FIELDS) out.put(f.key(), get(f.key()));
        return out;
    }

    /** Checks every value first, then saves; unknown keys and values out of range are refused. */
    public void save(Map<String, Object> values) {
        Map<String, Integer> ok = new LinkedHashMap<>();
        for (Map.Entry<String, Object> e : values.entrySet()) {
            Field f = field(e.getKey());
            int v;
            if (e.getValue() instanceof Number n) v = n.intValue();
            else if (e.getValue() instanceof Boolean b) v = b ? 1 : 0;
            else {
                try {
                    v = Integer.parseInt(String.valueOf(e.getValue()).trim());
                } catch (NumberFormatException ex) {
                    throw new IllegalArgumentException(f.label() + ": không phải số");
                }
            }
            if (v < f.min() || v > f.max()) throw new IllegalArgumentException(f.label() + " phải từ " + f.min() + " đến " + f.max());
            ok.put(f.key(), v);
        }
        for (Map.Entry<String, Integer> e : ok.entrySet()) {
            jdbc.update("INSERT INTO configurations (config_key, config_value, description, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW()) "
                    + "ON DUPLICATE KEY UPDATE config_value = VALUES(config_value), updated_at = NOW()",
                    key(e.getKey()), String.valueOf(e.getValue()), "Luyện tập trắc nghiệm: " + field(e.getKey()).label());
        }
    }

    private static final String MIX_KEY = "quiz/rank_mix";

    /** Percent of difficulty 1..5 per rank used by rank mode: the saved table, else {@link QuizGameRules#MIX}. */
    public int[][] rankMix() {
        List<String> rows = jdbc.queryForList("SELECT config_value FROM configurations WHERE config_key = ?", String.class, MIX_KEY);
        if (!rows.isEmpty()) {
            try {
                int[][] mix = new com.fasterxml.jackson.databind.ObjectMapper().readValue(rows.get(0), int[][].class);
                if (QuizGameRules.mixProblem(mix) == null) return mix;
            } catch (Exception ignored) {
                // a broken row falls back to the default table
            }
        }
        return QuizGameRules.MIX;
    }

    /** Saves the table after checking it (8 ranks, 5 levels, each row adds up to 100). */
    public void saveRankMix(int[][] mix) {
        String problem = QuizGameRules.mixProblem(mix);
        if (problem != null) throw new IllegalArgumentException(problem);
        String json;
        try {
            json = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(mix);
        } catch (Exception e) {
            throw new IllegalArgumentException("Bảng tỉ lệ không hợp lệ");
        }
        jdbc.update("INSERT INTO configurations (config_key, config_value, description, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW()) "
                + "ON DUPLICATE KEY UPDATE config_value = VALUES(config_value), updated_at = NOW()",
                MIX_KEY, json, "Luyện tập trắc nghiệm: tỉ lệ độ khó theo hạng (JSON)");
    }

    public static Field field(String k) {
        for (Field f : FIELDS) if (f.key().equals(k)) return f;
        throw new IllegalArgumentException("Không có cài đặt " + k);
    }
}
