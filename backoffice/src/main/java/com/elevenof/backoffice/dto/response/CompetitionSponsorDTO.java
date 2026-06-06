package com.elevenof.backoffice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompetitionSponsorDTO {
    private Long id;
    private String name;
    private String logoUrl;
    private String websiteUrl;
    private Integer displayOrder;
    private String adPosition;
    private String bannerImageUrl;
    private Boolean isActive;
}
