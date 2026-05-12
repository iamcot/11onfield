package com.elevenof.backoffice.service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.elevenof.backoffice.exception.RateLimitExceededException;
import com.elevenof.backoffice.model.OtpVerification;
import com.elevenof.backoffice.repository.OtpVerificationRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class OtpService {
    private final OtpVerificationRepository otpRepository;
    private final ZnsService znsService;

    @Value("${zalo.zns.testMode:false}")
    private boolean testMode;

    private static final String PURPOSE_PASSWORD_RESET = "PASSWORD_RESET";
    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int MAX_ATTEMPTS = 5;
    private static final int MAX_OTP_PER_DAY = 5; // Maximum 5 OTP requests per day per phone

    // Generate and send OTP
    public void generateAndSendOtp(String phone, String purpose) throws Exception {
        // Check daily OTP limit
        LocalDateTime dayStart = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        long otpCountToday = otpRepository.countByPhoneAndPurposeAndCreatedAtAfter(phone, purpose, dayStart);

        // Validate MAX_OTP_PER_DAY only if not in test mode
        if (!testMode && otpCountToday >= MAX_OTP_PER_DAY) {
            log.warn("Daily OTP limit exceeded for phone: {} (count: {})", phone, otpCountToday);
            throw new RateLimitExceededException("Daily OTP limit exceeded. Maximum 5 OTP requests per day.");
        }

        if (testMode && otpCountToday >= MAX_OTP_PER_DAY) {
            log.debug("Test mode: Daily OTP limit exceeded but allowing request for phone: {} (count: {})",
                phone, otpCountToday);
        }

        // Generate 6-digit OTP
        String otpCode = String.format("%06d", ThreadLocalRandom.current().nextInt(100000, 1000000));

        // Save to database
        OtpVerification otp = new OtpVerification();
        otp.setPhone(phone);
        otp.setOtpCode(otpCode);
        otp.setPurpose(purpose);
        otp.setVerified(false);
        otp.setAttempts(0);
        otp.setExpiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
        otpRepository.save(otp);

        // Send via ZNS
        try {
            znsService.sendOtp(phone, otpCode);
        } catch (Exception e) {
            log.error("Failed to send OTP to {}: {}", phone, e.getMessage());
            throw new RuntimeException("Failed to send OTP");
        }

        log.info("OTP sent to phone: {} (daily count: {}, testMode: {})", phone, otpCountToday + 1, testMode);
    }

    // Verify OTP
    public boolean verifyOtp(String phone, String otpCode, String purpose) {
        Optional<OtpVerification> otpOpt = otpRepository
                .findTopByPhoneAndPurposeAndVerifiedFalseOrderByCreatedAtDesc(phone, purpose);

        if (otpOpt.isEmpty()) {
            return false;
        }

        OtpVerification otp = otpOpt.get();

        // Check if expired
        if (LocalDateTime.now().isAfter(otp.getExpiresAt())) {
            return false;
        }

        // Check max attempts
        if (otp.getAttempts() >= MAX_ATTEMPTS) {
            return false;
        }

        // Increment attempts
        otp.setAttempts(otp.getAttempts() + 1);

        // Verify code
        if (otp.getOtpCode().equals(otpCode)) {
            otp.setVerified(true);
            otpRepository.save(otp);
            return true;
        }

        otpRepository.save(otp);
        return false;
    }

    // Cleanup expired OTPs (scheduled task)
    @Scheduled(cron = "0 0 * * * *") // Every hour
    public void cleanupExpiredOtps() {
        otpRepository.deleteByExpiresAtBefore(LocalDateTime.now());
        log.info("Cleaned up expired OTP verifications");
    }
}
