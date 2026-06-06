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
public class CompetitionListDTO {
    private Long id;
    private Integer season;
    private String title;
    private String picture;
    private String status;
    private String currentPhase;
    private LocalDate competitionStartDate;
    private LocalDate competitionEndDate;
    private Long participantCount;
}
