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
@Table(name = "competition_assessment_step_ratings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompetitionAssessmentStepRating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_step_id", nullable = false)
    @JsonIgnore
    private CompetitionAssessmentStep assessmentStep;

    @Column(nullable = false)
    private Integer level;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20, columnDefinition = "varchar(20)")
    private ThresholdType thresholdType;

    @Column(precision = 10, scale = 2)
    private BigDecimal thresholdValue;

    @Column(precision = 10, scale = 2)
    private BigDecimal rangeMin;

    @Column(precision = 10, scale = 2)
    private BigDecimal rangeMax;

    @Column(columnDefinition = "TEXT")
    private String description;

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
