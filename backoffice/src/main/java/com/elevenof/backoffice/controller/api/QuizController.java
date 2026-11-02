package com.elevenof.backoffice.controller.api;

import com.elevenof.backoffice.model.User;
import com.elevenof.backoffice.repository.UserRepository;
import com.elevenof.backoffice.service.quiz.QuizGameService;
import com.elevenof.backoffice.service.quiz.QuizSettings;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Football quiz practice for players. `status` and `leaderboard` are public; everything else needs a login.
 * While the feature is switched off (`quiz/enabled` = 0) only ADMIN and EDITOR accounts may play, to test it.
 */
@RestController
@RequestMapping("/api/quiz")
@RequiredArgsConstructor
public class QuizController {

    private final QuizGameService game;
    private final QuizSettings settings;
    private final UserRepository userRepository;

    private User currentUser(Authentication authentication) {
        if (authentication == null) return null;
        Object principal = authentication.getPrincipal();
        if (principal instanceof User u) return u;
        return principal instanceof String userid ? userRepository.findByUserid(userid).orElse(null) : null;
    }

    private static boolean staff(User u) {
        return u != null && (u.getRole() == User.Role.ADMIN || u.getRole() == User.Role.EDITOR);
    }

    private boolean visibleTo(User u) {
        return settings.enabled() || staff(u);
    }

    private static ResponseEntity<Map<String, Object>> fail(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("message", message));
    }

    /** Runs `body` for a signed-in player who may use the feature, turning rule errors into 400 with a message. */
    private ResponseEntity<?> play(Authentication auth, java.util.function.Function<User, Object> body) {
        User u = currentUser(auth);
        if (u == null) return fail(HttpStatus.UNAUTHORIZED, "Cần đăng nhập");
        if (!visibleTo(u)) return fail(HttpStatus.FORBIDDEN, "Tính năng luyện tập đang tạm tắt");
        try {
            return ResponseEntity.ok(body.apply(u));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return fail(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /** `{enabled, visible, boardEnabled}`: `visible` = the tab should show for this caller (on, or staff testing). */
    @GetMapping("/status")
    public Map<String, Object> status(Authentication auth) {
        User u = currentUser(auth);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("enabled", settings.enabled());
        out.put("visible", visibleTo(u));
        out.put("boardEnabled", settings.get("board_enabled") == 1);
        out.put("testing", !settings.enabled() && staff(u));
        return out;
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication auth) {
        return play(auth, u -> game.me(u.getId()));
    }

    /** Body `{mode: rank|practice, topic?, difficulty?}`. */
    @PostMapping("/start")
    public ResponseEntity<?> start(@RequestBody Map<String, Object> body, Authentication auth) {
        return play(auth, u -> game.start(u.getId(), String.valueOf(body.getOrDefault("mode", "rank")),
                body.get("topic") == null ? null : String.valueOf(body.get("topic")),
                body.get("difficulty") instanceof Number n ? n.intValue() : null));
    }

    /** Body `{attemptId, option 0-3, away?}`. */
    @PostMapping("/answer")
    public ResponseEntity<?> answer(@RequestBody Map<String, Object> body, Authentication auth) {
        if (!(body.get("attemptId") instanceof Number id)) return fail(HttpStatus.BAD_REQUEST, "Thiếu attemptId");
        int option = body.get("option") instanceof Number n ? n.intValue() : -1;
        boolean away = Boolean.TRUE.equals(body.get("away"));
        return play(auth, u -> game.answer(u.getId(), id.longValue(), option, away));
    }

    /** Body `{reason, note?}`. */
    @PostMapping("/questions/{id}/report")
    public ResponseEntity<?> report(@PathVariable long id, @RequestBody Map<String, Object> body, Authentication auth) {
        return play(auth, u -> Map.of("reported", game.report(u.getId(), id,
                body.get("reason") == null ? null : String.valueOf(body.get("reason")),
                body.get("note") == null ? null : String.valueOf(body.get("note")))));
    }

    @PostMapping("/mock/start")
    public ResponseEntity<?> mockStart(Authentication auth) {
        return play(auth, u -> game.mockStart(u.getId()));
    }

    /** Body `{answers: [shown position or -1, ...]}`. */
    @PostMapping("/mock/{id}/submit")
    public ResponseEntity<?> mockSubmit(@PathVariable long id, @RequestBody Map<String, Object> body, Authentication auth) {
        List<Integer> answers = new ArrayList<>();
        if (body.get("answers") instanceof List<?> list) for (Object o : list) answers.add(o instanceof Number n ? n.intValue() : -1);
        return play(auth, u -> game.mockSubmit(u.getId(), id, answers));
    }

    @GetMapping("/mock/history")
    public ResponseEntity<?> mockHistory(Authentication auth) {
        return play(auth, u -> game.mockHistory(u.getId()));
    }

    /** `type` week | month | all, optional `competitionId`. Public while the feature and the board are on. */
    @GetMapping("/leaderboard")
    public ResponseEntity<?> leaderboard(@RequestParam(defaultValue = "week") String type,
                                         @RequestParam(required = false) Long competitionId,
                                         Authentication auth) {
        User u = currentUser(auth);
        if (!visibleTo(u)) return fail(HttpStatus.FORBIDDEN, "Tính năng luyện tập đang tạm tắt");
        if (settings.get("board_enabled") != 1 && !staff(u)) return fail(HttpStatus.FORBIDDEN, "Bảng xếp hạng đang ẩn");
        return ResponseEntity.ok(game.leaderboard(type, competitionId, u == null ? null : u.getId()));
    }
}
