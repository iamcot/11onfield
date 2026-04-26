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

    // Follow counts
    private Long followersCount;
    private Long followingCount;
}
