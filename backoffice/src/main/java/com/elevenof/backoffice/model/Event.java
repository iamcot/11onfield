package com.elevenof.backoffice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "events")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 500)
    private String picture;

    @Column(length = 500)
    private String shortContent;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalDate endDate;

    @Column
    private LocalTime endTime;

    @Column(length = 300)
    private String location;

    @ManyToOne
    @JoinColumn(name = "province_id")
    private Province province;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EventStatus status;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum EventStatus {
        PLAN,              // Đang lên kế hoạch
        OPEN_REGISTER,     // Đang mở đăng ký
        CLOSE_REGISTER,    // Đóng đăng ký
        COMPLETE,          // Hoàn thành
        CANCELLED,         // Hủy bỏ
        DELETED            // Xóa
    }
}
