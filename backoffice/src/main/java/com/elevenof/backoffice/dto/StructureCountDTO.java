package com.elevenof.backoffice.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StructureCountDTO {
    private int daysCount;
    private int stepsCount;
    private int assessmentsCount;
}
