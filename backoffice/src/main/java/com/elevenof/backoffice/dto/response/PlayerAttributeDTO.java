package com.elevenof.backoffice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for player attribute data in API responses
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerAttributeDTO {
    private String attributeKey;
    private String attributeName;
    private Integer attributeValue;
    private String attributeGroup;
    private Boolean isHexagon;
    private Boolean isGoalKeeper;
    private Boolean isSynthetic;
    private LocalDateTime generationTimestamp;
}
