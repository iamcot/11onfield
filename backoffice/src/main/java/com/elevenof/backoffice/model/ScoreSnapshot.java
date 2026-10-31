package com.elevenof.backoffice.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Latest computed round score of a participant, with its breakdown. */
@Entity
@Table(name = "score_snapshots")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoreSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long stageId;

    @Column(nullable = false)
    private Long participantId;

    @Column(nullable = false)
    private Integer formulaVersion;

    @Column(precision = 6, scale = 2)
    private BigDecimal total;

    @Column(nullable = false)
    private Boolean complete;

    @Column(length = 40)
    private String classification;

    @Column(nullable = false, columnDefinition = "json")
    private String breakdown;

    @Column(nullable = false)
    private LocalDateTime computedAt;
}
