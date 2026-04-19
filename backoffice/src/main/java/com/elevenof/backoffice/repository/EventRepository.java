package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long>, JpaSpecificationExecutor<Event> {

    /**
     * Count active events (excluding DELETED status)
     */
    @Query("SELECT COUNT(e) FROM Event e WHERE e.status != 'DELETED'")
    long countActiveEvents();

    /**
     * Find upcoming events (excluding COMPLETE, CANCELLED, DELETED statuses)
     * Ordered by start date
     */
    @Query("SELECT e FROM Event e WHERE e.status NOT IN ('COMPLETE', 'CANCELLED', 'DELETED') ORDER BY e.startDate ASC")
    List<Event> findUpcomingEvents();
}
