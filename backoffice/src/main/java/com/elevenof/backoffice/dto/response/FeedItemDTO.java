package com.elevenof.backoffice.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class FeedItemDTO {
    private String type; // "event", "achievement", "highlight"
    private LocalDate date;
    private LocalDateTime createdAt;

    // User info
    private String fullName;
    private String userid;

    // Event data (when type = "event")
    private EventDTO event;

    // Achievement data (when type = "achievement")
    private AchievementDTO achievement;

    // Highlight data (when type = "highlight")
    private HighlightDTO highlight;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EventDTO {
        private Long eventId;
        private String title;
        private String description;
        private String location;
        private LocalDate startDate;
        private java.time.LocalTime startTime;
        private LocalDate endDate;
        private java.time.LocalTime endTime;
        private String status;
        private String imageUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AchievementDTO {
        private Long id;
        private String title;
        private String description;
        private String achievementType; // "INDIVIDUAL" or "TEAM"
        private LocalDate achievementDate;
        private String approvalStatus; // "PENDING", "APPROVED", "REJECTED"
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HighlightDTO {
        private Long id;
        private String url;
        private String platform;
        private String title;
        private LocalDate highlightDate;
        private String approvalStatus; // "PENDING", "APPROVED", "REJECTED"
    }
}
