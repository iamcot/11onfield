package com.elevenof.backoffice.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Service for managing Server-Sent Events (SSE) connections
 * Handles real-time notification delivery to connected clients
 */
@Service
@Slf4j
public class NotificationSseService {
    private final Map<Long, List<SseEmitter>> userEmitters = new ConcurrentHashMap<>();

    /**
     * Create new SSE emitter for a user
     * @param userId the user ID
     * @return configured SSE emitter
     */
    public SseEmitter createEmitter(Long userId) {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE); // No timeout

        emitter.onCompletion(() -> removeEmitter(userId, emitter));
        emitter.onTimeout(() -> removeEmitter(userId, emitter));
        emitter.onError(e -> {
            log.debug("SSE error for user: {} - {}", userId, e.getMessage());
            removeEmitter(userId, emitter);
        });

        userEmitters.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        try {
            emitter.send(SseEmitter.event()
                .name("connected")
                .data("Connection established"));
            log.info("SSE connection established for user: {}", userId);
        } catch (IOException | IllegalStateException e) {
            log.warn("Failed to send connected event to user: {}", userId);
            removeEmitter(userId, emitter);
        }

        return emitter;
    }

    /**
     * Notify user about new notifications (triggers frontend refresh)
     * @param userId the user ID to notify
     */
    public void notifyUser(Long userId) {
        List<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters == null || emitters.isEmpty()) {
            log.debug("No active SSE connections for user: {}", userId);
            return;
        }

        List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                    .name("notification")
                    .data("New notification"));
                log.debug("Notification event sent to user: {}", userId);
            } catch (IOException | IllegalStateException e) {
                log.debug("Failed to send notification event to user: {} (connection closed)", userId);
                deadEmitters.add(emitter);
            }
        }

        deadEmitters.forEach(emitter -> removeEmitter(userId, emitter));
    }

    /**
     * Send heartbeat to all connected clients every 30 seconds
     * Keeps connections alive and detects dead connections
     */
    @Scheduled(fixedRate = 30000) // Every 30 seconds
    public void sendHeartbeat() {
        int totalConnections = userEmitters.values().stream()
            .mapToInt(List::size)
            .sum();

        if (totalConnections == 0) {
            return;
        }

        log.debug("Sending heartbeat to {} active SSE connections", totalConnections);

        userEmitters.forEach((userId, emitters) -> {
            List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();

            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event()
                        .name("heartbeat")
                        .data("ping"));
                } catch (IOException | IllegalStateException e) {
                    log.debug("Dead SSE connection detected for user: {}", userId);
                    deadEmitters.add(emitter);
                }
            }

            deadEmitters.forEach(emitter -> removeEmitter(userId, emitter));
        });
    }

    /**
     * Remove emitter from user's connection list
     * @param userId the user ID
     * @param emitter the emitter to remove
     */
    private void removeEmitter(Long userId, SseEmitter emitter) {
        List<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                userEmitters.remove(userId);
                log.info("All SSE connections closed for user: {}", userId);
            }
        }
    }

    /**
     * Get count of active connections for a user
     * @param userId the user ID
     * @return number of active connections
     */
    public int getActiveConnectionCount(Long userId) {
        List<SseEmitter> emitters = userEmitters.get(userId);
        return emitters != null ? emitters.size() : 0;
    }

    /**
     * Get total number of active SSE connections across all users
     * @return total connection count
     */
    public int getTotalConnectionCount() {
        return userEmitters.values().stream()
            .mapToInt(List::size)
            .sum();
    }
}
