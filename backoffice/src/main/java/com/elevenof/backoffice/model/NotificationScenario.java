package com.elevenof.backoffice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * NotificationScenario Entity
 * Master configuration for notification types (e.g., WELCOME_EMAIL, ACHIEVEMENT_APPROVED)
 * Controls which channels (email, in-app, ZNS) are enabled per scenario
 */
@Entity
@Table(name = "notification_scenarios")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationScenario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String scenarioKey; // WELCOME_EMAIL, ACHIEVEMENT_APPROVED, etc.

    @Column(nullable = false, length = 100)
    private String name; // Display name in Vietnamese

    @Column(columnDefinition = "TEXT")
    private String description;

    @Builder.Default
    @Column(name = "email_enabled", nullable = false)
    private Boolean emailEnabled = false;

    @Builder.Default
    @Column(name = "inapp_enabled", nullable = false)
    private Boolean inappEnabled = true;

    @Builder.Default
    @Column(name = "zns_enabled", nullable = false)
    private Boolean znsEnabled = false;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
