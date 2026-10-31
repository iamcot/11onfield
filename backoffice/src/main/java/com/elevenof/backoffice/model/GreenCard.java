package com.elevenof.backoffice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** One of the four Green Cards of a competition. Used once; the contestant goes straight to the Top 30. */
@Entity
@Table(name = "green_cards")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GreenCard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "competition_id", nullable = false)
    private Long competitionId;

    @Column(name = "holder_user_id", nullable = false)
    private Long holderUserId;

    @Column(nullable = false, length = 100)
    private String holderTitle;

    @Column(name = "participant_id")
    private Long participantId;

    @Column(columnDefinition = "TEXT")
    private String reason;

    private LocalDateTime usedAt;
}
