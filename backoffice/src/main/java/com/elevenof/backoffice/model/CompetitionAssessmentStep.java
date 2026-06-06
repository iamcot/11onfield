package com.elevenof.backoffice.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "competition_assessment_steps")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompetitionAssessmentStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_day_id", nullable = false)
    @JsonIgnore
    private CompetitionAssessmentDay assessmentDay;

    @Column(nullable = false)
    private Integer stepNumber;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(nullable = false)
    @Builder.Default
    private Boolean hasRatingScale = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "assessmentStep", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CompetitionAssessment> assessments = new ArrayList<>();

    @OneToMany(mappedBy = "assessmentStep", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CompetitionAssessmentStepRating> ratingScales = new ArrayList<>();

    @OneToMany(mappedBy = "assessmentStep", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @JsonIgnore
    private List<CompetitionAssessmentStepScore> stepScores = new ArrayList<>();

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
