package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for Notification entity
 * Handles notification storage, retrieval, and read status management
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /**
     * Find paginated notifications for a user, ordered by creation date (newest first)
     * @param userId the user ID
     * @param pageable pagination parameters
     * @return page of notifications
     */
    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /**
     * Count unread notifications for a user
     * @param userId the user ID
     * @return count of unread notifications
     */
    long countByUserIdAndIsReadFalse(Long userId);

    /**
     * Find top 20 unread notifications for a user (for dropdown display)
     * @param userId the user ID
     * @return list of up to 20 unread notifications
     */
    List<Notification> findTop20ByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);

    /**
     * Mark all unread notifications as read for a user
     * @param userId the user ID
     * @param readAt the timestamp to set as read_at
     */
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.user.id = :userId AND n.isRead = false")
    void markAllAsRead(@Param("userId") Long userId, @Param("readAt") LocalDateTime readAt);
}
