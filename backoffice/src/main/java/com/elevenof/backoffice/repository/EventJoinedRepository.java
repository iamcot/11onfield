package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.Event;
import com.elevenof.backoffice.model.EventJoined;
import com.elevenof.backoffice.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventJoinedRepository extends JpaRepository<EventJoined, Long> {

    Optional<EventJoined> findByUserIdAndEventId(Long userId, Long eventId);

    boolean existsByUserIdAndEventId(Long userId, Long eventId);

    long countByEventId(Long eventId);

    @Query("SELECT ej.user FROM EventJoined ej WHERE ej.event.id = :eventId AND ej.user.enabled = true")
    List<User> findParticipantsByEventId(@Param("eventId") Long eventId);

    @Query("SELECT ej.event FROM EventJoined ej WHERE ej.user.id = :userId AND ej.event.status != 'DELETED' ORDER BY ej.createdAt DESC")
    Page<Event> findEventsByUserId(@Param("userId") Long userId, Pageable pageable);

    void deleteByUserIdAndEventId(Long userId, Long eventId);
}
