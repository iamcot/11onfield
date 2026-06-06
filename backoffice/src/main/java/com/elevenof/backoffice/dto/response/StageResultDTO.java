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
public class StageResultDTO {
    private Long id;
    private Long stageId;
    private String stageTitle;
    private Integer stageNumber;
    private Long userId;
    private String fullName;
    private String avatar;
    private BigDecimal score;
    private Integer rankPosition;
    private String performanceNotes;
    private String videoUrl;
    private Boolean isPublic;
}
