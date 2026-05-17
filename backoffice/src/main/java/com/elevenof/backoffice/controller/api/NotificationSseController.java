package com.elevenof.backoffice.controller.api;

import com.elevenof.backoffice.model.User;
import com.elevenof.backoffice.repository.UserRepository;
import com.elevenof.backoffice.service.NotificationSseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * Controller for Server-Sent Events (SSE) notification streaming
 * Provides real-time notification updates to connected clients
 */
@RestController
@RequestMapping("/api/users/me/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationSseController {
    private final NotificationSseService sseService;
    private final UserRepository userRepository;

    /**
     * Stream notifications via SSE
     * Client connects to this endpoint to receive real-time notification events
     * Supports JWT token via query parameter since EventSource doesn't support custom headers
     * @param authentication security context (populated by JWT filter from query param)
     * @return SSE emitter for streaming events
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamNotifications(Authentication authentication) {
        try {
            if (authentication == null) {
                log.error("❌ SSE connection failed: Authentication is null");
                throw new RuntimeException("Authentication required");
            }

            String userid = authentication.getName();
            if (userid == null) {
                log.error("❌ SSE connection failed: User ID is null");
                throw new RuntimeException("User ID not found in authentication");
            }

            log.debug("🔍 Looking up user: {}", userid);
            User user = userRepository.findByUserid(userid)
                .orElseThrow(() -> {
                    log.error("❌ SSE connection failed: User not found for userid: {}", userid);
                    return new RuntimeException("User not found: " + userid);
                });

            log.info("📡 SSE connection established for user: {} ({})", user.getId(), userid);
            return sseService.createEmitter(user.getId());
        } catch (Exception e) {
            log.error("❌ SSE stream error: {}", e.getMessage(), e);
            throw e;
        }
    }
}
