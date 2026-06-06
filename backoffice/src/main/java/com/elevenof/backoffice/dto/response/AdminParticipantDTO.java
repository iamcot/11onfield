package com.elevenof.backoffice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminParticipantDTO {
    private Long id;
    private Long userId;
    private String fullName;
    private String avatar;
    private String status;
    private String enrollmentType;
    private String selectedRegion;
    private LocalDateTime registrationDate;
    private BigDecimal totalScore;
}
