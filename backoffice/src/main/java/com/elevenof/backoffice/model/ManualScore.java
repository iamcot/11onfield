package com.elevenof.backoffice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** A score entered by hand. Append-only: a correction is a new row whose supersedesId points at the old one. */
@Entity
@Table(name = "manual_scores")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManualScore {

    /** Component keys, read by the scoring service when it builds the round total. */
    public static final String BHL = "BHL";
    public static final String TACTICAL_7V7 = "TACTICAL_7V7";
    public static final String MIND_MEDIA = "MIND_MEDIA";
    public static final String GPS_AI = "GPS_AI";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "stage_id", nullable = false)
    private Long stageId;

    @Column(name = "participant_id", nullable = false)
    private Long participantId;

    @Column(name = "component_key", nullable = false, length = 20)
    private String componentKey;

    @Column(nullable = false, precision = 6, scale = 2)
    private BigDecimal points;

    @Column(name = "entered_by", nullable = false)
    private Long enteredBy;

    @Column(nullable = false)
    private LocalDateTime enteredAt;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "supersedes_id")
    private Long supersedesId;
}
