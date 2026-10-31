package com.elevenof.backoffice.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

    /** Legacy single threshold; null on a level set by {@link #conditions}. */
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private ThresholdType thresholdType;

    @Column(precision = 10, scale = 2)
    private BigDecimal thresholdValue;

    @Column(precision = 10, scale = 2)
    private BigDecimal rangeMin;

    @Column(precision = 10, scale = 2)
    private BigDecimal rangeMax;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** GREY, RED, ORANGE, YELLOW or GREEN. */
    @Column(length = 10)
    private String color;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    @Builder.Default
    private RatingAction action = RatingAction.NONE;

    /** One bound per assessment of the step; empty on a legacy level. */
    @OneToMany(mappedBy = "rating", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CompetitionRatingCondition> conditions = new ArrayList<>();

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
