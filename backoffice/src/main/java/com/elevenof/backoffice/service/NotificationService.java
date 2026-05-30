package com.elevenof.backoffice.service;

import com.elevenof.backoffice.model.Notification;
import com.elevenof.backoffice.model.NotificationScenario;
import com.elevenof.backoffice.model.NotificationTemplate;
import com.elevenof.backoffice.model.User;
import com.elevenof.backoffice.repository.NotificationRepository;
import com.elevenof.backoffice.repository.NotificationScenarioRepository;
import com.elevenof.backoffice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

/**
 * Main notification orchestration service
 * Coordinates sending notifications across multiple channels (Email, In-App, ZNS)
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final NotificationScenarioRepository scenarioRepository;
    private final NotificationTemplateService templateService;
    private final EmailService emailService;
    private final ZnsService znsService;
    private final NotificationSseService sseService;
    private final UserRepository userRepository;

    /**
     * Send notification asynchronously across all enabled channels
     * @param userId the target user ID
     * @param scenarioKey the notification scenario key (e.g., "WELCOME_EMAIL", "ACHIEVEMENT_APPROVED")
     * @param variables template variables for substitution (e.g., {"fullName": "John", "email": "john@example.com"})
     * @param data optional JSON data for scenario-specific metadata (e.g., {"achievementId": 123})
     */
    @Async("notificationExecutor")
    public void sendNotification(Long userId, String scenarioKey, Map<String, String> variables, String data) {
        log.info("🔔 Sending notification: userId={}, scenario={}", userId, scenarioKey);

        try {
            NotificationScenario scenario = scenarioRepository.findByScenarioKey(scenarioKey)
                .orElseThrow(() -> new IllegalArgumentException("Unknown scenario: " + scenarioKey));

            User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

            // In-App Notification
            if (scenario.getInappEnabled()) {
                sendInAppNotification(user, scenario, variables, data);
            }

            // Email Notification
            if (scenario.getEmailEnabled() && user.getEmail() != null && !user.getEmail().isEmpty()) {
                log.info("📧 Attempting to send email notification to: {} for scenario: {}", user.getEmail(), scenarioKey);
                sendEmailNotification(user, scenario, variables);
            } else {
                if (!scenario.getEmailEnabled()) {
                    log.info("⏭️ Email notification skipped: email channel disabled for scenario: {}", scenarioKey);
                } else if (user.getEmail() == null || user.getEmail().isEmpty()) {
                    log.info("⏭️ Email notification skipped: user {} has no email address", userId);
                }
            }

            // ZNS Notification
            if (scenario.getZnsEnabled() && user.getPhone() != null && !user.getPhone().isEmpty()) {
                sendZnsNotification(user, scenario, variables);
            }

            log.info("✅ Notification sent successfully: userId={}, scenario={}", userId, scenarioKey);
        } catch (Exception e) {
            log.error("❌ Failed to send notification: userId={}, scenario={}", userId, scenarioKey, e);
        }
    }

    /**
     * Send in-app notification (stored in database, triggers SSE event)
     */
    private void sendInAppNotification(User user, NotificationScenario scenario,
                                       Map<String, String> variables, String data) {
        try {
            Optional<NotificationTemplate> templateOpt = templateService.getActiveTemplate(
                scenario, NotificationTemplate.Channel.INAPP
            );

            if (templateOpt.isEmpty()) {
                log.warn("⚠️ No active INAPP template for scenario: {}", scenario.getScenarioKey());
                return;
            }

            NotificationTemplate template = templateOpt.get();
            String title = template.getSubject() != null
                ? templateService.renderTemplate(template.getSubject(), variables)
                : scenario.getName();
            String message = templateService.renderTemplate(template.getBodyTemplate(), variables);

            Notification notification = Notification.builder()
                .user(user)
                .scenarioKey(scenario.getScenarioKey())
                .channel(Notification.Channel.INAPP)
                .title(title)
                .message(message)
                .data(data)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

            notificationRepository.save(notification);

            // Trigger SSE event to notify frontend
            sseService.notifyUser(user.getId());

            log.info("📱 In-app notification sent to user: {}", user.getId());
        } catch (Exception e) {
            log.error("❌ Failed to send in-app notification", e);
        }
    }

    /**
     * Send email notification
     */
    private void sendEmailNotification(User user, NotificationScenario scenario,
                                       Map<String, String> variables) {
        try {
            log.info("📧 Looking for EMAIL template for scenario: {}", scenario.getScenarioKey());
            Optional<NotificationTemplate> templateOpt = templateService.getActiveTemplate(
                scenario, NotificationTemplate.Channel.EMAIL
            );

            if (templateOpt.isEmpty()) {
                log.warn("⚠️ No active EMAIL template for scenario: {}", scenario.getScenarioKey());
                return;
            }

            log.info("✅ Found EMAIL template for scenario: {}", scenario.getScenarioKey());
            NotificationTemplate template = templateOpt.get();
            String subject = templateService.renderTemplate(template.getSubject(), variables);
            String body = templateService.renderTemplate(template.getBodyTemplate(), variables);

            log.info("📤 Calling emailService.sendEmail() to: {}", user.getEmail());
            emailService.sendEmail(user.getEmail(), subject, body);
            log.info("📧 Email notification sent to: {}", user.getEmail());
        } catch (Exception e) {
            log.error("❌ Failed to send email notification to: {}", user.getEmail(), e);
        }
    }

    /**
     * Send ZNS notification (Zalo ZNS)
     */
    private void sendZnsNotification(User user, NotificationScenario scenario,
                                    Map<String, String> variables) {
        try {
            Optional<NotificationTemplate> templateOpt = templateService.getActiveTemplate(
                scenario, NotificationTemplate.Channel.ZNS
            );

            if (templateOpt.isEmpty()) {
                log.warn("⚠️ No active ZNS template for scenario: {}", scenario.getScenarioKey());
                return;
            }

            NotificationTemplate template = templateOpt.get();
            String message = templateService.renderTemplate(template.getBodyTemplate(), variables);

            // TODO: Integrate with ZnsService for actual ZNS sending
            // For now, just log
            log.info("📲 ZNS notification would be sent to: {} - Message: {}", user.getPhone(), message);
        } catch (Exception e) {
            log.error("❌ Failed to send ZNS notification", e);
        }
    }

    /**
     * Get paginated notifications for a user
     * @param userId the user ID
     * @param pageable pagination parameters
     * @return page of notifications
     */
    public Page<Notification> getUserNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    /**
     * Get unread notification count for a user
     * @param userId the user ID
     * @return count of unread notifications
     */
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    /**
     * Mark a notification as read
     * @param notificationId the notification ID
     * @param userId the user ID (for authorization check)
     */
    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new IllegalArgumentException("Notification not found"));

        if (!notification.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized: Notification does not belong to user");
        }

        if (!notification.getIsRead()) {
            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);

            // Trigger SSE update to refresh unread count
            sseService.notifyUser(userId);
            log.info("✅ Notification marked as read: id={}, userId={}", notificationId, userId);
        }
    }

    /**
     * Mark all notifications as read for a user
     * @param userId the user ID
     */
    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId, LocalDateTime.now());
        sseService.notifyUser(userId);
        log.info("✅ All notifications marked as read for user: {}", userId);
    }

    /**
     * Get top 20 unread notifications for dropdown display
     * @param userId the user ID
     * @return list of up to 20 unread notifications
     */
    public java.util.List<Notification> getRecentUnreadNotifications(Long userId) {
        return notificationRepository.findTop20ByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
    }
}
