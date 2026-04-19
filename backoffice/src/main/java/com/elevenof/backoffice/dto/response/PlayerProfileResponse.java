package com.elevenof.backoffice.dto.response;

import com.elevenof.backoffice.model.Player;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PlayerProfileResponse {
    private Long id;
    private List<String> positions;
    private Integer height;
    private Integer weight;
    private String preferredFoot;
    private Long academyId;
    private Player.PlayerLevel level;
    private String bio;
    private Long followersCount;
    private Long followingCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
