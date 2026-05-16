package com.elevenof.backoffice.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "player_highlights")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerHighlight {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;

    @Column(nullable = false, length = 500)
    private String url;

    @Column(length = 50)
    private String platform;

    @Column(length = 200)
    private String title;

    @Column(name = "highlight_date")
    private LocalDate highlightDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", nullable = false, length = 20)
    private ApprovalStatus approvalStatus;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = updatedAt = LocalDateTime.now();
        if (approvalStatus == null) {
            approvalStatus = ApprovalStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum ApprovalStatus {
        PENDING,
        APPROVED,
        REJECTED
    }
}
