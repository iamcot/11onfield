package com.elevenof.backoffice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Player Attribute Type Entity
 * Defines the types of attributes that can be assigned to players
 * e.g., Speed, Strength, Passing, etc.
 */
@Entity
@Table(name = "player_attribute_types")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerAttributeType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String attributeKey; // e.g., "speed", "strength", "passing"

    @Column(nullable = false, length = 100)
    private String attributeName; // e.g., "Tốc độ", "Sức mạnh", "Chuyền bóng"

    @Column(nullable = false)
    private Boolean isHexagon = true; // Whether this attribute is displayed in hexagon chart

    @Column(nullable = false)
    private Boolean isGoalKeeper = false; // Whether this attribute is specific to goalkeepers

    @Column(length = 50)
    private String attributeGroup; // e.g., "physical", "technical", "mental"

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Column(length = 100)
    private String createdBy;

    @Column(length = 100)
    private String updatedBy;

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
