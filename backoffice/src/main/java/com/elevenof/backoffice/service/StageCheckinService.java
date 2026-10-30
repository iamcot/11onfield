package com.elevenof.backoffice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.*;

/**
 * QR check-in at a competition stage. The admin screen shows a QR that changes every
 * {@link #WINDOW_SECONDS} seconds (HMAC of the stage secret and the time window), so a photo of it
 * stops working shortly after. The player scans it while logged in; the participant then gets status
 * CHECKED_IN, the stage's region, and the stage as their latest check-in. Checking in again at another
 * stage is allowed and becomes the latest.
 */
@Service
@RequiredArgsConstructor
public class StageCheckinService {

    public static final int WINDOW_SECONDS = 30;

    private final JdbcTemplate jdbc;

    @Value("${app.frontend.url:http://localhost:7070}")
    private String frontendUrl;

    public record Code(String code, String url, int secondsLeft) {}

    public record Result(String competitionTitle, String stageTitle, String region, LocalDateTime checkedInAt, boolean again) {}

    /** Stages that can take check-ins: every stage of competitions that are not draft or completed, regional auditions first. */
    public List<Map<String, Object>> stages() {
        return jdbc.queryForList("""
            SELECT s.id, s.stage_number AS stageNumber, s.title, s.stage_type AS stageType, s.region,
                   DATE_FORMAT(s.stage_date, '%Y-%m-%d') AS stageDate, s.status, c.id AS competitionId, c.title AS competitionTitle,
                   (s.checkin_secret IS NOT NULL) AS open,
                   (SELECT COUNT(*) FROM stage_checkins sc WHERE sc.stage_id = s.id) AS checkins
            FROM competition_stages s JOIN competitions c ON c.id = s.competition_id
            WHERE c.status NOT IN ('DRAFT', 'COMPLETED')
            ORDER BY c.season DESC, (s.stage_type = 'REGIONAL_AUDITION') DESC, s.stage_number""");
    }

    public void setOpen(long stageId, boolean open) {
        int n = jdbc.update("UPDATE competition_stages SET checkin_secret = ? WHERE id = ?", open ? randomSecret() : null, stageId);
        if (n == 0) throw new IllegalArgumentException("Không tìm thấy vòng");
    }

    /** The code to show now, or null when check-in is closed. */
    public Code currentCode(long stageId) {
        String secret = secretOf(stageId);
        if (secret == null) return null;
        long now = System.currentTimeMillis() / 1000;
        long window = now / WINDOW_SECONDS;
        String code = stageId + "-" + window + "-" + sign(secret, stageId, window);
        String url = frontendUrl.replaceAll("/+$", "") + "/check-in?c=" + URLEncoder.encode(code, StandardCharsets.UTF_8);
        return new Code(code, url, (int) ((window + 1) * WINDOW_SECONDS - now));
    }

    public List<Map<String, Object>> checkins(long stageId) {
        return jdbc.queryForList("""
            SELECT sc.participant_id AS participantId, DATE_FORMAT(sc.checked_in_at, '%Y-%m-%dT%H:%i:%s') AS checkedInAt, u.id AS userId,
                   u.full_name AS fullName, u.phone, p.selected_region AS region,
                   (SELECT COUNT(*) FROM competition_participants p2
                     WHERE p2.competition_id = p.competition_id
                       AND (p2.registration_date < p.registration_date OR (p2.registration_date = p.registration_date AND p2.id <= p.id))) AS sbd,
                   (p.last_checkin_stage_id <> sc.stage_id) AS movedOn
            FROM stage_checkins sc
            JOIN competition_participants p ON p.id = sc.participant_id
            JOIN users u ON u.id = p.user_id
            WHERE sc.stage_id = ?
            ORDER BY sc.checked_in_at DESC""", stageId);
    }

    /** Latest check-in per participant of a competition: participantId -> {stageTitle, at}. */
    public Map<Long, Map<String, Object>> latestByParticipant(long competitionId) {
        Map<Long, Map<String, Object>> out = new HashMap<>();
        jdbc.query("""
            SELECT p.id, s.title, s.stage_number, p.last_checkin_at
            FROM competition_participants p JOIN competition_stages s ON s.id = p.last_checkin_stage_id
            WHERE p.competition_id = ?""", rs -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("stageTitle", rs.getString("title"));
            m.put("stageNumber", rs.getInt("stage_number"));
            Timestamp at = rs.getTimestamp("last_checkin_at");
            m.put("at", at != null ? at.toLocalDateTime().toString() : null);
            out.put(rs.getLong("id"), m);
        }, competitionId);
        return out;
    }

    /** Called by the logged-in player who scanned the QR. Messages are shown to the player as they are. */
    @Transactional
    public Result checkIn(long userId, String code) {
        String[] parts = code == null ? new String[0] : code.trim().split("-");
        long stageId, window;
        try {
            if (parts.length != 3) throw new NumberFormatException();
            stageId = Long.parseLong(parts[0]);
            window = Long.parseLong(parts[1]);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Mã check-in không hợp lệ.");
        }
        String secret = secretOf(stageId);
        if (secret == null) throw new IllegalStateException("Vòng này đang đóng check-in.");
        long now = System.currentTimeMillis() / 1000 / WINDOW_SECONDS;
        // Accept the current and the previous window, so a scan right before the code changes still works.
        if ((window != now && window != now - 1) || !sign(secret, stageId, window).equals(parts[2])) {
            throw new IllegalStateException("Mã QR đã hết hạn. Hãy quét lại mã đang hiển thị.");
        }

        Map<String, Object> stage = jdbc.queryForMap("""
            SELECT s.title, s.region, s.competition_id, c.title AS ctitle
            FROM competition_stages s JOIN competitions c ON c.id = s.competition_id WHERE s.id = ?""", stageId);
        long competitionId = ((Number) stage.get("competition_id")).longValue();
        List<Map<String, Object>> rows = jdbc.queryForList(
            "SELECT id, status FROM competition_participants WHERE competition_id = ? AND user_id = ?", competitionId, userId);
        if (rows.isEmpty()) throw new IllegalStateException("Bạn chưa đăng ký tham gia " + stage.get("ctitle") + ".");
        long participantId = ((Number) rows.get(0).get("id")).longValue();

        LocalDateTime at = LocalDateTime.now();
        boolean again = jdbc.update("""
            INSERT INTO stage_checkins (stage_id, participant_id, checked_in_at) VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE checked_in_at = VALUES(checked_in_at)""", stageId, participantId, at) != 1;
        String region = (String) stage.get("region");
        jdbc.update("""
            UPDATE competition_participants
            SET last_checkin_stage_id = ?, last_checkin_at = ?, updated_at = ?,
                selected_region = COALESCE(?, selected_region),
                status = CASE WHEN status = 'REGISTERED' THEN 'CHECKED_IN' ELSE status END
            WHERE id = ?""", stageId, at, at, region, participantId);
        return new Result((String) stage.get("ctitle"), (String) stage.get("title"), region, at, again);
    }

    private String secretOf(long stageId) {
        List<String> s = jdbc.queryForList("SELECT checkin_secret FROM competition_stages WHERE id = ?", String.class, stageId);
        return s.isEmpty() ? null : s.get(0);
    }

    private static String sign(String secret, long stageId, long window) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] h = mac.doFinal((stageId + ":" + window).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(h, 0, 6);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static String randomSecret() {
        byte[] b = new byte[24];
        new SecureRandom().nextBytes(b);
        return HexFormat.of().formatHex(b);
    }
}
