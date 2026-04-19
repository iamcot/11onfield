package com.elevenof.backoffice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Scouter Profile Entity
 * Contains scouter-specific information linked to User via @OneToOne
 * Shares primary key with User through @MapsId
 */
@Entity
@Table(name = "scouters")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Scouter {

    @Id
    private Long id; // Same as User.id

    @OneToOne
    @MapsId
    @JoinColumn(name = "id")
    private User user;

    @Column(length = 200)
    private String territory; // e.g., "Northern Vietnam", "Southeast Asia"

    @Column(length = 200)
    private String specialization; // e.g., "Youth Scouting", "International Recruitment"

    private Integer yearsOfExperience;

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
