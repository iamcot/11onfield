package com.elevenof.backoffice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardEntryDTO {
    private Integer rank;
    private Long userId;
    private String userProfileId;
    private String fullName;
    private String avatar;
    private BigDecimal totalScore;
    private String selectedRegion;
}
