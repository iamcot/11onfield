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
@Table(name = "competition_assessments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompetitionAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_step_id", nullable = false)
    @JsonIgnore
    private CompetitionAssessmentStep assessmentStep;

    @Column(nullable = false)
    private Integer assessmentNumber;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 50)
    private String unit;

    @Column(nullable = false)
    @Builder.Default
    private Integer attemptsCount = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ScoringMethod scoringMethod;

    @Column(nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private ValueDirection direction = ValueDirection.HIGHER;

    /** Values outside the plausible range are saved but sent to review. */
    @Column(precision = 10, scale = 3)
    private BigDecimal plausibleMin;

    @Column(precision = 10, scale = 3)
    private BigDecimal plausibleMax;

    /** Largest gap allowed between two sources of the same attempt. */
    @Column(precision = 10, scale = 3)
    private BigDecimal tolerance;

    @Column(nullable = false, length = 12)
    @Builder.Default
    private String valueType = "NUMBER";

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "assessment", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @JsonIgnore
    private List<CompetitionAssessmentResult> attemptResults = new ArrayList<>();

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
