package com.elevenof.backoffice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Player Profile Entity
 * Contains player-specific information linked to User via @OneToOne
 * Shares primary key with User through @MapsId
 */
@Entity
@Table(name = "players")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Player {

    @Id
    private Long id; // Same as User.id

    @OneToOne
    @MapsId
    @JoinColumn(name = "id")
    private User user;

    @Column(length = 500)
    private String positions; // Comma-separated: striker,midfielder,defender

    private Integer height; // in cm

    private Integer weight; // in kg

    @Column(length = 10)
    private String preferredFoot; // left, right, both

    @Column(name = "academy_id")
    private Long academyId;  // For future Academy relationship

    @Column(length = 50)
    @Convert(converter = com.elevenof.backoffice.converter.PlayerLevelConverter.class)
    private PlayerLevel level;

    /**
     * Player level enum with Vietnamese display names
     */
    public enum PlayerLevel {
        CAU_THU_MOI("Cầu thủ mới"),
        NGHIEP_DU("Nghiệp dư"),
        TUYEN_TRE("Tuyển trẻ"),
        CHUYEN_NGHIEP("Chuyên nghiệp");

        private final String displayName;

        PlayerLevel(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    @Column(columnDefinition = "TEXT")
    private String bio;

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
