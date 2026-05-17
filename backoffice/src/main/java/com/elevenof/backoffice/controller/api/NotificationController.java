package com.elevenof.backoffice.controller.api;

import com.elevenof.backoffice.model.Notification;
import com.elevenof.backoffice.model.User;
import com.elevenof.backoffice.repository.UserRepository;
import com.elevenof.backoffice.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST API controller for user notifications
 * Provides endpoints for fetching, reading, and managing notifications
 */
@RestController
@RequestMapping("/api/users/me/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    /**
     * Get authenticated user from security context
     */
    private User getUserFromAuthentication(Authentication authentication) {
        String userid = authentication.getName();
        return userRepository.findByUserid(userid)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }

    /**
     * Get paginated notifications for current user
     * @param authentication security context
     * @param page page number (default 0)
     * @param size page size (default 20)
     * @return page of notifications
     */
    @GetMapping
    public ResponseEntity<Page<Notification>> getNotifications(
        Authentication authentication,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        User user = getUserFromAuthentication(authentication);
        Page<Notification> notifications = notificationService.getUserNotifications(
            user.getId(),
            PageRequest.of(page, size)
        );
        log.info("📋 Fetched {} notifications for user: {}", notifications.getNumberOfElements(), user.getId());
        return ResponseEntity.ok(notifications);
    }

    /**
     * Get recent unread notifications (top 20 for dropdown)
     * @param authentication security context
     * @return list of unread notifications
     */
    @GetMapping("/recent-unread")
    public ResponseEntity<List<Notification>> getRecentUnread(Authentication authentication) {
        User user = getUserFromAuthentication(authentication);
        List<Notification> notifications = notificationService.getRecentUnreadNotifications(user.getId());
        log.info("📋 Fetched {} recent unread notifications for user: {}", notifications.size(), user.getId());
        return ResponseEntity.ok(notifications);
    }

    /**
     * Get unread notification count
     * @param authentication security context
     * @return unread count
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication authentication) {
        User user = getUserFromAuthentication(authentication);
        long count = notificationService.getUnreadCount(user.getId());
        log.debug("🔢 Unread count for user {}: {}", user.getId(), count);
        return ResponseEntity.ok(Map.of("count", count));
    }

    /**
     * Mark a notification as read
     * @param id notification ID
     * @param authentication security context
     * @return no content
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
        @PathVariable Long id,
        Authentication authentication
    ) {
        User user = getUserFromAuthentication(authentication);
        notificationService.markAsRead(id, user.getId());
        log.info("✅ Notification {} marked as read by user {}", id, user.getId());
        return ResponseEntity.ok().build();
    }

    /**
     * Mark all notifications as read for current user
     * @param authentication security context
     * @return no content
     */
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        User user = getUserFromAuthentication(authentication);
        notificationService.markAllAsRead(user.getId());
        log.info("✅ All notifications marked as read for user {}", user.getId());
        return ResponseEntity.ok().build();
    }
}
