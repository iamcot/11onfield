package com.elevenof.backoffice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** A player's own choice to show less than the admin allows. */
@Entity
@Table(name = "player_visibility")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerVisibility {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DataGroup dataGroup;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private VisibilityLevel level;
}
