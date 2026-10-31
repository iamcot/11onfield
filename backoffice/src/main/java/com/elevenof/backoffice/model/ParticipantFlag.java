package com.elevenof.backoffice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** A flag on a contestant. Revoked flags stay in the table so the history is kept. */
@Entity
@Table(name = "participant_flags")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParticipantFlag {

    public enum Kind {
        MEDICAL_OUT,      // doctor: not fit to continue, blocks the next stations
        DISCIPLINE,       // coordinator: counted for tie-breaks
        LOW_PERFORMANCE,  // raised by the system when a step rating has action FLAG
        DNS               // did not take part
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "participant_id", nullable = false)
    private Long participantId;

    @Column(name = "stage_id")
    private Long stageId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Kind kind;

    @Column(name = "step_id")
    private Long stepId;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "revoked_by")
    private Long revokedBy;

    private LocalDateTime revokedAt;

    @Column(columnDefinition = "TEXT")
    private String revokeReason;

    public boolean isActive() {
        return revokedAt == null;
    }
}
