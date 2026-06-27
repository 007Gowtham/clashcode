package com.clashcode.dsa_multiplayer.auth.service;

/**
 * EmailService — abstraction so SMTP implementation can be swapped
 * for another provider (SES, SendGrid, etc.) without touching AuthService.
 */
public interface EmailService {

    void sendVerificationEmail(String to, String code);

    void sendForgotPasswordEmail(String to, String code);
}
