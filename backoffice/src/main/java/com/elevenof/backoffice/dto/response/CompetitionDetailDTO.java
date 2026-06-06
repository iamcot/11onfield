package com.elevenof.backoffice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompetitionDetailDTO {
    private Long id;
    private Integer season;
    private String title;
    private String description;
    private String picture;
    private String status;
    private String currentPhase;
    private LocalDate registrationStartDate;
    private LocalDate registrationEndDate;
    private LocalDate competitionStartDate;
    private LocalDate competitionEndDate;
    private Long participantCount;
    private List<StageDTO> stages;
}
