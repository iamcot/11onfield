package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.NotificationScenario;
import com.elevenof.backoffice.model.NotificationTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for NotificationTemplate entity
 * Handles template retrieval for rendering notifications
 */
@Repository
public interface NotificationTemplateRepository extends JpaRepository<NotificationTemplate, Long> {

    /**
     * Find active templates for a specific scenario and channel
     * @param scenario the notification scenario
     * @param channel the notification channel (EMAIL, INAPP, ZNS)
     * @return list of active templates (typically 1 or 0)
     */
    List<NotificationTemplate> findByScenarioAndChannelAndActiveTrue(
        NotificationScenario scenario,
        NotificationTemplate.Channel channel
    );

    /**
     * Find all templates for a specific scenario (for admin editing)
     * @param scenarioId the scenario ID
     * @return list of all templates for the scenario
     */
    List<NotificationTemplate> findByScenarioId(Long scenarioId);
}
