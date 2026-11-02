package com.elevenof.backoffice.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class PlayerProfileRequest {
    private List<String> positions;
    private String secondaryPosition;
    private Integer height;
    private Integer weight;
    private String preferredFoot; // left, right, both
}
