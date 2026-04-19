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
    private Integer height;
    private Integer weight;
    private String preferredFoot;
    private Player.PlayerLevel level;
    private String bio;
}
