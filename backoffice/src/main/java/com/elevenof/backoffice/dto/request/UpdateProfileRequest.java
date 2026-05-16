package com.elevenof.backoffice.dto.request;

import com.elevenof.backoffice.model.Player;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {
    // User fields
    private String fullName;
    private String email;
    private String avatar;
    private LocalDate dob;
    private String gender; // MALE, FEMALE, OTHER

    // Address fields
    private Long provinceId;
    private String address;
    private String ward;

    // Player-specific fields (only for PLAYER role)
    private List<String> positions;
    private String secondaryPosition;
    private Integer yearsOfExperience;
    private Integer height;
    private Integer weight;
    private String preferredFoot;
    private Player.PlayerLevel level;
    private String bio;

    // New extended player fields
    private String personalId;  // CCCD/Identity card number
    private String residentialAddress;  // Player's residential address (full address)
    private String school;  // Current school
    private String academy;  // Football academy
    private String club;  // Current football club

    // New collections
    private List<AchievementRequest> individualAchievements;
    private List<AchievementRequest> teamAchievements;
    private List<AchievementRequest> participantAchievements;
    private List<HighlightRequest> highlights;  // Changed to HighlightRequest to include date
    private List<String> socials;  // Social media URLs

    /**
     * Nested DTO for achievement data
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AchievementRequest {
        private String title;
        private String description;
        private LocalDate date;  // Achievement date
    }

    /**
     * Nested DTO for highlight data
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HighlightRequest {
        private String url;
        private LocalDate date;  // Highlight date
    }
}
