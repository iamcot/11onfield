package com.elevenof.backoffice.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/** The band one assessment's value must fall in for a rating level; a null side is open. */
@Entity
@Table(name = "competition_rating_conditions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompetitionRatingCondition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rating_id", nullable = false)
    @JsonIgnore
    private CompetitionAssessmentStepRating rating;

    @Column(name = "assessment_id", nullable = false)
    private Long assessmentId;

    @Column(precision = 10, scale = 3)
    private BigDecimal rangeMin;

    @Column(precision = 10, scale = 3)
    private BigDecimal rangeMax;
}
