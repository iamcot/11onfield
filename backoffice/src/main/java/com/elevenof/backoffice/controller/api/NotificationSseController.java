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
        String userid = authentication.getName();
        User user = userRepository.findByUserid(userid)
            .orElseThrow(() -> new RuntimeException("User not found"));

        log.info("📡 SSE connection established for user: {} ({})", user.getId(), userid);
        return sseService.createEmitter(user.getId());
    }
}
