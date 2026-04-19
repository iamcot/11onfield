package com.elevenof.backoffice.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private UserResponse user;
    private TokenResponse tokens;
}
