package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.NotificationScenario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for NotificationScenario entity
 * Handles CRUD operations for notification scenario configurations
 */
@Repository
public interface NotificationScenarioRepository extends JpaRepository<NotificationScenario, Long> {

    /**
     * Find notification scenario by its unique key
     * @param scenarioKey unique scenario key (e.g., "WELCOME_EMAIL", "ACHIEVEMENT_APPROVED")
     * @return Optional containing the scenario if found
     */
    Optional<NotificationScenario> findByScenarioKey(String scenarioKey);
}
