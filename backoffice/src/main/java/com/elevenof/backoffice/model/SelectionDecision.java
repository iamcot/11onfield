package com.elevenof.backoffice.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** The head of the panel's pick for a selection round; the newest row of a round is in force. */
@Entity
@Table(name = "selection_decisions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SelectionDecision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long competitionId;

    @Column(nullable = false, length = 20)
    private String roundKey;

    /** JSON array of participant ids. */
    @Column(nullable = false, columnDefinition = "json")
    private String participantIds;

    /** JSON object participantId → why picked out of score order. */
    @Column(columnDefinition = "json")
    private String notes;

    private Long decidedBy;

    @Column(nullable = false)
    private LocalDateTime decidedAt;
}
