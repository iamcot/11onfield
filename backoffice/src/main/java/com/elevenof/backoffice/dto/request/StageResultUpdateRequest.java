package com.elevenof.backoffice.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StageResultUpdateRequest {
    private BigDecimal score;
    private Integer rankPosition;
    private String performanceNotes;
    private String videoUrl;
}
