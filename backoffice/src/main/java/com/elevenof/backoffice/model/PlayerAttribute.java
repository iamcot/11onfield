package com.elevenof.backoffice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Player Attribute Entity
 * Links players to their specific attribute values
 */
@Entity
@Table(name = "player_attributes",
    uniqueConstraints = @UniqueConstraint(columnNames = {"player_id", "attribute_type_id"})
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerAttribute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "attribute_type_id", nullable = false)
    private PlayerAttributeType attributeType;

    @Column(nullable = false)
    private Integer attributeValue; // Value from 0-100 or 0-10 depending on scale

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
