package com.elevenof.backoffice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StageDTO {
    private Long id;
    private Integer stageNumber;
    private String title;
    private String description;
    private LocalDate stageDate;
    private String stageTime;
    private String stageType;
    private String region;
    private String status;
    private Boolean isPublicScoring;
}
