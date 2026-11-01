package com.elevenof.backoffice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** A player's application to a recruitment event, filled from the event's form. */
@Entity
@Table(name = "event_registrations",
       uniqueConstraints = @UniqueConstraint(columnNames = {"event_id", "user_id"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    /** The player's account; null when a guest applied without one (see guest*). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "guest_name", length = 200)
    private String guestName;

    @Column(name = "guest_phone", length = 30)
    private String guestPhone;

    @Column(name = "guest_email", length = 200)
    private String guestEmail;

    /** JSON list of {id, label, type, value}: a snapshot of the form as the player filled it. */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String answers;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.SUBMITTED;

    @Column(name = "forwarded_at")
    private LocalDateTime forwardedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "forwarded_by")
    private User forwardedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
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

    public String displayName() { return user != null ? user.getFullName() : guestName; }
    public String displayPhone() { return user != null ? user.getPhone() : guestPhone; }
    public String displayEmail() { return user != null ? user.getEmail() : guestEmail; }

    public enum Status {
        SUBMITTED,  // Đã gửi, chờ 11of chuyển
        FORWARDED   // Đã chuyển hồ sơ cho đơn vị tuyển sinh
    }
}
