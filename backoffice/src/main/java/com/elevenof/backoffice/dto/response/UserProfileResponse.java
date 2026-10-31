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
    private String secondaryPosition;
    private Integer yearsOfExperience;
    private Integer height;
    private Integer weight;
    private String preferredFoot;
    private String level;
    private String bio;
    private List<PlayerAttributeDTO> attributes;
    private List<PlayerAttributeDTO> profileStats;  // FIT EXP SKL PRF ACH HLT

    // New extended player fields
    private String personalId;
    private String residentialAddress;  // Player's full residential address (renamed to avoid conflict)
    private String school;
    private String academy;
    private String club;
    private Boolean verified;  // Player verification status
    private String fullBodyPhoto;  // Full-body photo with the background removed

    // New collections
    private List<AchievementDTO> individualAchievements;
    private List<AchievementDTO> teamAchievements;
    private List<AchievementDTO> participantAchievements;
    private List<HighlightDTO> highlights;
    private List<SocialDTO> socials;

    /** Scouting Combine blocks the viewer may see; left out of the JSON when there is none. */
    @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL)
    private CombineDTO combine;
    /** The owner's own visibility settings; only sent to the owner. */
    @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL)
    private List<com.elevenof.backoffice.controller.api.UserController.VisibilitySettingDTO> visibility;

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
        private String approvalStatus;  // PENDING, APPROVED, REJECTED
        private Boolean hidden;  // only sent to the owner
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
        private String approvalStatus;  // PENDING, APPROVED, REJECTED
        private String kind;  // LINK or VIDEO (uploaded to Bunny)
        private String posterUrl;
        private String embedUrl;  // iframe player of an uploaded video
        private Boolean hidden;  // only sent to the owner
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
