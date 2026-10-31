package com.elevenof.backoffice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "visibility_policies")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VisibilityPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long competitionId;

    /** NULL = applies to the whole competition. */
    private Long stageId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DataGroup dataGroup;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private VisibilityLevel maxLevel;

    @Column(nullable = false)
    private Boolean ownerCanHide;
}
