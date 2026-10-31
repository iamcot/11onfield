package com.elevenof.backoffice.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** A score topic (nhóm điểm) of an assessment day: Thể hình 10, Kỹ thuật 20 ... */
@Entity
@Table(name = "competition_score_topics")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompetitionScoreTopic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "assessment_day_id", nullable = false)
    private Long assessmentDayId;

    @Column(nullable = false, length = 30)
    private String topicKey;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, precision = 6, scale = 2)
    private BigDecimal maxPoints;

    @Column(nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    private Integer tieBreakOrder;

    /** null: average of its problems' levels; "PREV_DAY": the total of an earlier day (sourceDayId), out of 100. */
    @Column(length = 10)
    private String source;

    private Long sourceDayId;

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
