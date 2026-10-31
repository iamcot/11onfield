package com.elevenof.backoffice.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** One number as it was sent, never changed; a correction is a new record that supersedes it. */
@Entity
@Table(name = "measurement_raw")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeasurementRaw {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 36, unique = true)
    private String clientUuid;

    @Column(nullable = false)
    private Long assessmentId;

    @Column(nullable = false)
    private Long participantId;

    @Column(nullable = false)
    private Integer attemptNumber;

    @Column(precision = 10, scale = 3)
    private BigDecimal value;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private MeasurementStatus status;

    @Column(length = 200)
    private String faultNote;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private MeasurementSource source;

    private Long deviceId;

    private Long recordedBy;

    @Column(nullable = false)
    private LocalDateTime measuredAt;

    @Column(nullable = false)
    private LocalDateTime receivedAt;

    @Column(length = 500)
    private String evidenceUrl;

    private Long supersedesId;

    @Column(length = 300)
    private String reason;
}
