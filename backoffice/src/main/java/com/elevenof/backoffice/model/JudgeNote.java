package com.elevenof.backoffice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** What one judge recorded about one contestant at one station: ticks and a note, never a number. */
@Entity
@Table(name = "judge_notes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JudgeNote {

    public enum Participation { FULL, PARTIAL, NONE }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "judge_user_id", nullable = false)
    private Long judgeUserId;

    @Column(name = "participant_id", nullable = false)
    private Long participantId;

    @Column(name = "step_id", nullable = false)
    private Long stepId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 8)
    private Participation participation;

    @Builder.Default
    @Column(nullable = false)
    private Boolean ticked = false;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
