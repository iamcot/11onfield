package com.elevenof.backoffice.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** The raw record that counts for one attempt, and whether a person still has to look at it. */
@Entity
@Table(name = "measurement_official")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeasurementOfficial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long assessmentId;

    @Column(nullable = false)
    private Long participantId;

    @Column(nullable = false)
    private Integer attemptNumber;

    private Long rawId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private OfficialState state;

    @Column(length = 30)
    private String reviewReason;

    private Long resolvedBy;

    private LocalDateTime resolvedAt;

    @Column(length = 300)
    private String note;

    @Column(insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
