package com.elevenof.backoffice.service;

import com.elevenof.backoffice.model.NotificationScenario;
import com.elevenof.backoffice.model.NotificationTemplate;
import com.elevenof.backoffice.repository.NotificationTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service for notification template management and rendering
 * Handles template variable substitution and template retrieval
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class NotificationTemplateService {
    private final NotificationTemplateRepository templateRepository;

    /**
     * Render template with variable substitution using mustache-style {{variable}} syntax
     * @param template the template string with {{variableName}} placeholders
     * @param variables map of variable names to values
     * @return rendered string with all variables replaced
     */
    public String renderTemplate(String template, Map<String, String> variables) {
        String result = template;
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            String placeholder = "{{" + entry.getKey() + "}}";
            String value = entry.getValue() != null ? entry.getValue() : "";
            result = result.replace(placeholder, value);
        }
        return result;
    }

    /**
     * Get active template for a specific scenario and channel
     * @param scenario the notification scenario
     * @param channel the notification channel (EMAIL, INAPP, ZNS)
     * @return Optional containing the active template if found
     */
    public Optional<NotificationTemplate> getActiveTemplate(
        NotificationScenario scenario,
        NotificationTemplate.Channel channel
    ) {
        List<NotificationTemplate> templates = templateRepository
            .findByScenarioAndChannelAndActiveTrue(scenario, channel);

        if (templates.isEmpty()) {
            log.warn("No active template found for scenario: {} and channel: {}",
                scenario.getScenarioKey(), channel);
            return Optional.empty();
        }

        if (templates.size() > 1) {
            log.warn("Multiple active templates found for scenario: {} and channel: {}. Using first one.",
                scenario.getScenarioKey(), channel);
        }

        return Optional.of(templates.get(0));
    }

    /**
     * Save or update notification template
     * @param template the template to save
     * @return saved template
     */
    public NotificationTemplate saveTemplate(NotificationTemplate template) {
        log.info("Saving notification template: scenarioId={}, channel={}",
            template.getScenario().getId(), template.getChannel());
        return templateRepository.save(template);
    }

    /**
     * Get all templates for a specific scenario (for admin editing)
     * @param scenarioId the scenario ID
     * @return list of templates
     */
    public List<NotificationTemplate> getTemplatesByScenario(Long scenarioId) {
        return templateRepository.findByScenarioId(scenarioId);
    }

    /**
     * Get template by ID
     * @param id template ID
     * @return Optional containing the template if found
     */
    public Optional<NotificationTemplate> getTemplateById(Long id) {
        return templateRepository.findById(id);
    }

    /**
     * Delete template by ID
     * @param id template ID
     */
    public void deleteTemplate(Long id) {
        log.info("Deleting notification template: id={}", id);
        templateRepository.deleteById(id);
    }
}
