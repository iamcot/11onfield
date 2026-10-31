package com.elevenof.backoffice.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** A judge's personal pick of a participant for a selection round. */
@Entity
@Table(name = "selection_votes")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SelectionVote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long competitionId;

    @Column(nullable = false, length = 20)
    private String roundKey;

    @Column(nullable = false)
    private Long judgeUserId;

    @Column(nullable = false)
    private Long participantId;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}
