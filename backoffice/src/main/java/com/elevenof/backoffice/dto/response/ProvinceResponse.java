package com.elevenof.backoffice.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProvinceResponse {
    private Long id;
    private String name;
}
