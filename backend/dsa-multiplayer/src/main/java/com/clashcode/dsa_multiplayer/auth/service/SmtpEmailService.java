package com.clashcode.dsa_multiplayer.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * SMTP-backed implementation of EmailService.
 *
 * In dev profile the mail host points to a local SMTP trap (MailHog/Mailpit),
 * so no real emails are sent. In prod, it uses the configured SMTP credentials.
 *
 * To swap to another provider (SES, SendGrid), create a new @Service @Primary
 * implementation of EmailService and remove @Primary from this class.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SmtpEmailService implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:clashcode@localhost}")
    private String fromAddress;

    @Override
    public void sendVerificationEmail(String to, String code) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(to);
            message.setSubject("ClashCode — Verify your email");
            message.setText(
                "Your verification code is: " + code + "\n\n" +
                "This code expires in 24 hours.\n\n" +
                "If you did not register for ClashCode, you can safely ignore this email."
            );
            mailSender.send(message);
            log.info("Verification email sent to {}", to);
        } catch (Exception e) {
            // Log but don't crash — in dev with no SMTP, we log the code to console
            log.warn("Failed to send verification email to {}: {}. Code was: {}", to, e.getMessage(), code);
        }
    }

    @Override
    public void sendForgotPasswordEmail(String to, String code) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(to);
            message.setSubject("ClashCode — Password reset code");
            message.setText(
                "Your password reset code is: " + code + "\n\n" +
                "This code expires in 15 minutes.\n\n" +
                "If you did not request a password reset, you can safely ignore this email."
            );
            mailSender.send(message);
            log.info("Password reset email sent to {}", to);
        } catch (Exception e) {
            log.warn("Failed to send reset email to {}: {}. Code was: {}", to, e.getMessage(), code);
        }
    }
}
