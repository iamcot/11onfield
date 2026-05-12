package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {
    Optional<OtpVerification> findTopByPhoneAndPurposeAndVerifiedFalseOrderByCreatedAtDesc(String phone, String purpose);
    long countByPhoneAndPurposeAndCreatedAtAfter(String phone, String purpose, LocalDateTime createdAfter);
    void deleteByExpiresAtBefore(LocalDateTime dateTime);
}
