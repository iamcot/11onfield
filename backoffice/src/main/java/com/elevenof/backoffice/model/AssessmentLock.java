package com.elevenof.backoffice.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** A step closed for scoring; open while unlockedAt is null. */
@Entity
@Table(name = "assessment_locks")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssessmentLock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long stepId;

    private Long lockedBy;

    @Column(nullable = false)
    private LocalDateTime lockedAt;

    private Long unlockedBy;

    private LocalDateTime unlockedAt;

    @Column(length = 300)
    private String reason;
}
