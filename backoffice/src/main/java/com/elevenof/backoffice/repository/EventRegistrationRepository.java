package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.EventRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventRegistrationRepository extends JpaRepository<EventRegistration, Long> {

    Optional<EventRegistration> findByEventIdAndUserId(Long eventId, Long userId);

    boolean existsByEventIdAndUserIsNullAndGuestPhone(Long eventId, String guestPhone);

    @Query("SELECT r FROM EventRegistration r LEFT JOIN FETCH r.user WHERE r.event.id = :eventId ORDER BY r.createdAt DESC")
    List<EventRegistration> findByEventIdWithUser(@Param("eventId") Long eventId);

    long countByEventId(Long eventId);

    long countByEventIdAndStatus(Long eventId, EventRegistration.Status status);

    long countByStatus(EventRegistration.Status status);
}
