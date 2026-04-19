package com.elevenof.backoffice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class UserResponse {
    private Long id;
    private String phone;
    private String userid;
    private String fullName;
    private String email;
    private String role;
    private String avatar;
    private LocalDate dob;
    private String gender;
    private AddressResponse address;
    private LocalDateTime createdAt;
}
