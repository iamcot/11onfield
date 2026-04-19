package com.elevenof.backoffice.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "Họ và tên không được để trống")
    private String fullName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^0\\d{9}$", message = "Số điện thoại không hợp lệ")
    private String phone;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 8, message = "Mật khẩu phải có ít nhất 8 ký tự")
    private String password;

    @NotNull(message = "Role không được để trống")
    private String role; // USER, PLAYER, COACH, SCOUTER

    @Email(message = "Email không hợp lệ")
    private String email;

    @NotNull(message = "Tỉnh/Thành phố không được để trống")
    private Long provinceId;

    // Only for PLAYER role
    private PlayerProfileRequest playerProfile;
}
