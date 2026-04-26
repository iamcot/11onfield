package com.elevenof.backoffice.dto.response;

import com.elevenof.backoffice.model.Player;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Lightweight DTO for players list view
 * Includes calculated fields like age and formatted data
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerListDTO {
    private Long id;
    private String userid;
    private String fullName;
    private String avatar;
    private Integer age; // Calculated from dob
    private Integer height;
    private Integer weight;
    private List<String> positions;
    private String preferredFoot;
    private Player.PlayerLevel level;
    private String provinceName;
    private Long academyId; // For future use
    private Integer followerCount; // Always 0 for now (Phase 4)
    private List<PlayerAttributeDTO> attributes;
}
