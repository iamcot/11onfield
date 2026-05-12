package com.elevenof.backoffice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class UserProfileResponse {
    private Long id;
    private String phone;
    private String userid;
    private String fullName;
    private String email;
    private String role;
    private String avatar;
    private LocalDate dob;
    private String gender;
    private LocalDateTime createdAt;
    private AddressResponse address;

    // Player profile data (if user is a PLAYER)
    private List<String> positions;
    private Integer height;
    private Integer weight;
    private String preferredFoot;
    private String level;
    private String bio;
    private List<PlayerAttributeDTO> attributes;

    // New extended player fields
    private String personalId;
    private String residentialAddress;  // Player's full residential address (renamed to avoid conflict)
    private String school;
    private String academy;
    private String club;

    // New collections
    private List<AchievementDTO> individualAchievements;
    private List<AchievementDTO> teamAchievements;
    private List<HighlightDTO> highlights;
    private List<SocialDTO> socials;

    // Follow counts
    private Long followersCount;
    private Long followingCount;

    /**
     * Nested DTO for achievement response
     */
    @Data
    @Builder
    public static class AchievementDTO {
        private Long id;
        private String title;
        private String description;
        private LocalDate date;
    }

    /**
     * Nested DTO for highlight response
     */
    @Data
    @Builder
    public static class HighlightDTO {
        private Long id;
        private String url;
        private String platform;
        private String title;
        private LocalDate date;
    }

    /**
     * Nested DTO for social media response
     */
    @Data
    @Builder
    public static class SocialDTO {
        private Long id;
        private String url;
        private String platform;
    }
}
