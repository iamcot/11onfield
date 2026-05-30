package com.elevenof.backoffice.event;

import com.elevenof.backoffice.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Event listener for notification events
 * Listens after transaction commits to ensure all user data is saved before sending notifications
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventListener {
    private final NotificationService notificationService;

    /**
     * Handle notification event AFTER transaction commits
     * This ensures all user data is properly saved in database before notification is sent
     * across any channel (EMAIL, INAPP, ZNS)
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleNotification(NotificationEvent event) {
        log.info("🎉 Handling notification event after commit: userId={}, scenario={}",
            event.getUserId(), event.getScenarioKey());
        notificationService.sendNotification(
            event.getUserId(),
            event.getScenarioKey(),
            event.getVariables(),
            event.getData()
        );
    }
}
