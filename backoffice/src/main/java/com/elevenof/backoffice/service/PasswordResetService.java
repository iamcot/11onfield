package com.elevenof.backoffice.service;

import com.elevenof.backoffice.exception.InvalidOtpException;
import com.elevenof.backoffice.exception.InvalidTokenException;
import com.elevenof.backoffice.exception.ResourceNotFoundException;
import com.elevenof.backoffice.model.PasswordResetToken;
import com.elevenof.backoffice.model.User;
import com.elevenof.backoffice.repository.PasswordResetTokenRepository;
import com.elevenof.backoffice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class PasswordResetService {
    private final UserRepository userRepository;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final OtpService otpService;
    private final PasswordEncoder passwordEncoder;

    private static final int TOKEN_EXPIRY_MINUTES = 15;
    private static final String OTP_PURPOSE = "PASSWORD_RESET";

    // Step 1: Request password reset (send OTP)
    public void requestPasswordReset(String phone) throws Exception {
        // Verify user exists
        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Send OTP
        otpService.generateAndSendOtp(phone, OTP_PURPOSE);
    }

    // Step 2: Verify OTP and generate reset token
    public String verifyOtpAndGenerateToken(String phone, String otpCode) {
        // Verify user exists
        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Verify OTP
        boolean isValid = otpService.verifyOtp(phone, otpCode, OTP_PURPOSE);
        if (!isValid) {
            throw new InvalidOtpException("Invalid or expired OTP");
        }

        // Generate reset token
        String token = UUID.randomUUID().toString().replace("-", "");

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUser(user);
        resetToken.setToken(token);
        resetToken.setUsed(false);
        resetToken.setExpiresAt(LocalDateTime.now().plusMinutes(TOKEN_EXPIRY_MINUTES));
        resetTokenRepository.save(resetToken);

        log.info("Password reset token generated for user: {}", user.getPhone());
        return token;
    }

    // Step 3: Reset password with token
    public void resetPassword(String token, String newPassword) {
        // Find valid token
        PasswordResetToken resetToken = resetTokenRepository
                .findByTokenAndUsedFalseAndExpiresAtAfter(token, LocalDateTime.now())
                .orElseThrow(() -> new InvalidTokenException("Invalid or expired token"));

        // Update user password
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Mark token as used
        resetToken.setUsed(true);
        resetTokenRepository.save(resetToken);

        log.info("Password reset successful for user: {}", user.getPhone());
    }

    // Cleanup expired tokens (scheduled task)
    @Scheduled(cron = "0 0 * * * *") // Every hour
    public void cleanupExpiredTokens() {
        resetTokenRepository.deleteByExpiresAtBefore(LocalDateTime.now());
        log.info("Cleaned up expired password reset tokens");
    }
}
