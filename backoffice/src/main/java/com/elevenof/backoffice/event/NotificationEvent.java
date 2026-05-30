package com.elevenof.backoffice.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.util.Map;

/**
 * Generic event for sending notifications after transaction commits
 * This ensures all user data is properly saved before sending notifications via any channel
 */
@Getter
public class NotificationEvent extends ApplicationEvent {
    private final Long userId;
    private final String scenarioKey;
    private final Map<String, String> variables;
    private final String data;

    public NotificationEvent(Object source, Long userId, String scenarioKey,
                           Map<String, String> variables, String data) {
        super(source);
        this.userId = userId;
        this.scenarioKey = scenarioKey;
        this.variables = variables;
        this.data = data;
    }
}
