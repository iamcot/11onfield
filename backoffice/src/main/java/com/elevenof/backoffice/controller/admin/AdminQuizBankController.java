package com.elevenof.backoffice.controller.admin;

import com.elevenof.backoffice.service.quiz.QuizBankRules;
import com.elevenof.backoffice.service.quiz.QuizBankService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Admin JSON API of the football quiz question bank (/quan-tri/trac-nghiem): topics, AI writing, review, overview. */
@RestController
@RequestMapping("/api/admin/quiz")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('EDITOR', 'ADMIN')")
public class AdminQuizBankController {

    private final QuizBankService bank;

    private static ResponseEntity<Map<String, Object>> error(String message) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", message));
    }

    private static String who(Authentication auth) {
        return auth == null ? null : auth.getName();
    }

    @GetMapping("/overview")
    public Map<String, Object> overview(@RequestParam(defaultValue = "practice") String pool,
                                        @RequestParam(defaultValue = "" + QuizBankRules.DEFAULT_TARGET) int target) {
        return bank.overview(pool, Math.max(1, Math.min(target, 1000)));
    }

    // ---------- topics ----------

    @GetMapping("/topics")
    public List<QuizBankService.Topic> topics() {
        return bank.topics(false);
    }

    @PostMapping("/topics")
    public ResponseEntity<?> createTopic(@RequestBody Map<String, Object> body) {
        try {
            Object key = body.get("key");
            return ResponseEntity.status(HttpStatus.CREATED).body(bank.saveTopic(key == null ? null : String.valueOf(key), body, true));
        } catch (IllegalArgumentException e) {
            return error(e.getMessage());
        }
    }

    @PutMapping("/topics/{key}")
    public ResponseEntity<?> updateTopic(@PathVariable String key, @RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(bank.saveTopic(key, body, false));
        } catch (IllegalArgumentException e) {
            return error(e.getMessage());
        }
    }

    // ---------- AI ----------

    /** Body `{topic, difficulty 1-5, count 1-10, pool practice|exam}`; one batch, takes up to a minute. */
    @PostMapping("/generate")
    public ResponseEntity<?> generate(@RequestBody Map<String, Object> body, Authentication auth) {
        if (!bank.aiConfigured()) return error("Chưa cấu hình AI (cần ZNS_RELAY_URL và ZNS_RELAY_API_KEY trỏ tới AnyLearn).");
        String topic = body.get("topic") == null ? null : String.valueOf(body.get("topic"));
        int difficulty = body.get("difficulty") instanceof Number n ? n.intValue() : 0;
        int count = body.get("count") instanceof Number n ? n.intValue() : 5;
        String pool = body.get("pool") == null ? "practice" : String.valueOf(body.get("pool"));
        QuizBankService.GenResult result = bank.generate(topic, difficulty, count, pool, who(auth));
        if (result.error() != null && result.saved() == 0) return error(result.error());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/runs")
    public List<Map<String, Object>> runs(@RequestParam(defaultValue = "30") int limit) {
        return bank.recentRuns(limit);
    }

    // ---------- questions ----------

    /** `status` = pending | active | hidden | reported; the review queue is `status=pending`. */
    @GetMapping("/questions")
    public Map<String, Object> questions(@RequestParam(required = false) String topic,
                                         @RequestParam(required = false) Integer difficulty,
                                         @RequestParam(required = false) String status,
                                         @RequestParam(required = false) String pool,
                                         @RequestParam(required = false) String q,
                                         @RequestParam(defaultValue = "0") int page,
                                         @RequestParam(defaultValue = "20") int size) {
        return bank.questions(topic, difficulty, status, pool, q, page, size);
    }

    /** Body `{topic, difficulty, pool?, body, options[4], correct 0-3, explanation?, diagram?, mediaUrl?, status?}`. */
    @PostMapping("/questions")
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body, Authentication auth) {
        try {
            long id = bank.create(body, who(auth));
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("id", id);
            return ResponseEntity.status(HttpStatus.CREATED).body(out);
        } catch (IllegalArgumentException e) {
            return error(e.getMessage());
        }
    }

    /** Same body as create; fields left out keep their value; `diagram: null` removes the diagram. */
    @PutMapping("/questions/{id}")
    public ResponseEntity<?> update(@PathVariable long id, @RequestBody Map<String, Object> body, Authentication auth) {
        try {
            bank.update(id, body, who(auth));
            return ResponseEntity.ok(Map.of("id", id));
        } catch (IllegalArgumentException e) {
            return error(e.getMessage());
        }
    }

    /** Body `{ids: [..], status: active|hidden|pending}`: approve or hide many at once. */
    @PostMapping("/questions/status")
    public ResponseEntity<?> setStatus(@RequestBody Map<String, Object> body, Authentication auth) {
        List<Long> ids = new ArrayList<>();
        if (body.get("ids") instanceof List<?> list) for (Object o : list) if (o instanceof Number n) ids.add(n.longValue());
        try {
            return ResponseEntity.ok(Map.of("changed", bank.setStatus(ids, String.valueOf(body.get("status")), who(auth))));
        } catch (IllegalArgumentException e) {
            return error(e.getMessage());
        }
    }
}
