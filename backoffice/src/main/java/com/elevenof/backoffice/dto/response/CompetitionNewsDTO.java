package com.elevenof.backoffice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompetitionNewsDTO {
    private Long id;
    private String title;
    private String shortContent;
    private String content;
    private String thumbnail;
    private String authorName;
    private String authorByline;
    private LocalDateTime publishedAt;
    private Boolean isFeatured;
}
