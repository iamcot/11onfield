package com.elevenof.backoffice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

/**
 * Service for sending email notifications
 * Logs to console in local dev mode (when mail.enabled=false)
 * Sends actual emails in production via SMTP
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;

    @Value("${spring.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${spring.mail.from:noreply@11of.com}")
    private String fromEmail;

    /**
     * Send email notification
     * @param to recipient email address
     * @param subject email subject
     * @param body email body (HTML format)
     */
    public void sendEmail(String to, String subject, String body) {
        // Log to console if mail is disabled
        if (!mailEnabled) {
            log.info("📧 Email (LOCAL MODE - Not Sent):");
            log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            log.info("From: {}", fromEmail);
            log.info("To: {}", to);
            log.info("Subject: {}", subject);
            log.info("Body:\n{}", body);
            log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true); // true = HTML format

            mailSender.send(message);
            log.info("✅ Email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("❌ Failed to send email to: {}", to, e);
            throw new RuntimeException("Email sending failed: " + e.getMessage(), e);
        }
    }

    /**
     * Send email to multiple recipients
     * @param recipients array of recipient email addresses
     * @param subject email subject
     * @param body email body (HTML format)
     */
    public void sendEmailToMultiple(String[] recipients, String subject, String body) {
        for (String recipient : recipients) {
            sendEmail(recipient, subject, body);
        }
    }
}
