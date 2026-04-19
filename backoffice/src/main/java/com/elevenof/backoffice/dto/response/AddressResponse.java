package com.elevenof.backoffice.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AddressResponse {
    private Long id;
    private ProvinceResponse province;
    private String address;
    private String ward;
}
