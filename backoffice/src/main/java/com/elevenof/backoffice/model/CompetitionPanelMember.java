package com.elevenof.backoffice.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** One account on a competition's scouting panel. The website role (coach, scout) alone grants nothing here. */
@Entity
@Table(name = "competition_panel_members")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompetitionPanelMember {

    public enum PanelRole {
        /** Head coach: the highest on the panel; enters the coaching staff (BHL) score and decides the Top 30. */
        HLV,
        /** Scout: checks in, scores at the stations, takes notes, enters the other manual scores, votes. */
        TTV
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "competition_id", nullable = false)
    private Long competitionId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "panel_role", nullable = false)
    private PanelRole panelRole;

    @Column(name = "added_by")
    private Long addedBy;

    @Column(name = "added_at", nullable = false)
    private LocalDateTime addedAt;
}
