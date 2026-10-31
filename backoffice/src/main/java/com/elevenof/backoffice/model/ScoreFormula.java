package com.elevenof.backoffice.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** One version of a round's formula; the definition is a {@link com.elevenof.backoffice.scoring.RoundFormula} as JSON. */
@Entity
@Table(name = "score_formulas")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoreFormula {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long stageId;

    @Column(nullable = false)
    private Integer version;

    @Column(nullable = false, columnDefinition = "json")
    private String definition;

    private Long createdBy;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime lockedAt;
}
