package com.elevenof.backoffice.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "stage_results")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StageResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stage_id", nullable = false)
    @JsonIgnore
    private CompetitionStage stage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant_id", nullable = false)
    @JsonIgnore
    private CompetitionParticipant participant;

    @Column(precision = 10, scale = 2)
    private BigDecimal score;

    private Integer rankPosition;

    @Column(columnDefinition = "TEXT")
    private String performanceNotes;

    @Column(length = 500)
    private String videoUrl;

    @Column(nullable = false)
    private Boolean isPublic;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isCalculated = true;

    @Column(columnDefinition = "JSON")
    private String calculationDetails;

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
