package com.clashcode.dsa_multiplayer.auth.service;

import com.clashcode.dsa_multiplayer.auth.dto.*;
import com.clashcode.dsa_multiplayer.auth.entity.*;
import com.clashcode.dsa_multiplayer.auth.repository.*;
import com.clashcode.dsa_multiplayer.auth.security.JwtService;
import com.clashcode.dsa_multiplayer.common.exception.ApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Random;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final VerificationCodeRepository verificationCodeRepository;
    private final PasswordResetCodeRepository passwordResetCodeRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;

    @Value("${app.email.cooldown-seconds:60}")
    private long cooldownSeconds;

    @Value("${app.email.verify-code-expiry-hours:24}")
    private long verifyCodeExpiryHours;

    @Value("${app.email.reset-code-expiry-minutes:15}")
    private long resetCodeExpiryMinutes;

    // ── Register ──────────────────────────────────────────────────────────────

    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail().toLowerCase())) {
            throw new ApiException("EMAIL_TAKEN: Email already in use", HttpStatus.CONFLICT);
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ApiException("USERNAME_TAKEN: Username already taken", HttpStatus.CONFLICT);
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .isVerified(false)
                .build();
        userRepository.save(user);

        String code = generateNumericCode();
        VerificationCode vc = VerificationCode.builder()
                .user(user)
                .code(code)
                .expiresAt(Instant.now().plusSeconds(verifyCodeExpiryHours * 3600))
                .build();
        verificationCodeRepository.save(vc);

        emailService.sendVerificationEmail(user.getEmail(), code);
        log.info("User registered: {} <{}>", user.getUsername(), user.getEmail());
    }

    // ── Verify Email ──────────────────────────────────────────────────────────

    @Transactional
    public void verifyEmail(VerifyRequest request) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new ApiException("USER_NOT_FOUND: No account with that email", HttpStatus.NOT_FOUND));

        if (user.isVerified()) {
            throw new ApiException("ALREADY_VERIFIED: Account is already verified", HttpStatus.BAD_REQUEST);
        }

        VerificationCode vc = verificationCodeRepository
                .findTopByUserIdOrderByCreatedAtDesc(user.getId())
                .orElseThrow(() -> new ApiException("CODE_NOT_FOUND: No verification code found — request a new one", HttpStatus.BAD_REQUEST));

        if (Instant.now().isAfter(vc.getExpiresAt())) {
            throw new ApiException("CODE_EXPIRED: Verification code has expired — request a new one", HttpStatus.BAD_REQUEST);
        }
        if (!vc.getCode().equals(request.getCode())) {
            throw new ApiException("INVALID_CODE: Incorrect verification code", HttpStatus.BAD_REQUEST);
        }

        user.setVerified(true);
        userRepository.save(user);
        verificationCodeRepository.deleteAllByUserId(user.getId());
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new ApiException("INVALID_CREDENTIALS: Invalid email or password", HttpStatus.UNAUTHORIZED));

        if (!user.isVerified()) {
            throw new ApiException("EMAIL_NOT_VERIFIED: Please verify your email before logging in", HttpStatus.FORBIDDEN);
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new ApiException("INVALID_CREDENTIALS: Invalid email or password", HttpStatus.UNAUTHORIZED);
        }

        return issueTokenPair(user);
    }

    // ── Refresh Token ─────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        String rawToken = request.getRefreshToken();
        String tokenHash = jwtService.hashRefreshToken(rawToken);

        RefreshToken stored = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new ApiException("INVALID_REFRESH_TOKEN: Refresh token not recognised", HttpStatus.UNAUTHORIZED));

        if (stored.isRevoked()) {
            // Reuse detected — revoke entire family to force re-login
            log.warn("Refresh token reuse detected for family {}. Revoking all tokens in family.", stored.getFamilyId());
            refreshTokenRepository.revokeAllByFamilyId(stored.getFamilyId());
            throw new ApiException("REFRESH_TOKEN_REUSED: Session invalidated due to token reuse — please log in again", HttpStatus.UNAUTHORIZED);
        }

        if (Instant.now().isAfter(stored.getExpiresAt())) {
            stored.setRevoked(true);
            refreshTokenRepository.save(stored);
            throw new ApiException("REFRESH_TOKEN_EXPIRED: Refresh token has expired — please log in again", HttpStatus.UNAUTHORIZED);
        }

        // Rotate: revoke old token, issue new one in the SAME family
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        User user = stored.getUser();
        String newRawRefreshToken = jwtService.generateRawRefreshToken();
        RefreshToken newToken = RefreshToken.builder()
                .user(user)
                .tokenHash(jwtService.hashRefreshToken(newRawRefreshToken))
                .familyId(stored.getFamilyId())   // same family
                .revoked(false)
                .expiresAt(Instant.now().plusMillis(jwtService.getRefreshTokenExpirationMs()))
                .build();
        refreshTokenRepository.save(newToken);

        String newAccessToken = jwtService.generateAccessToken(user.getId());
        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRawRefreshToken)
                .user(AuthResponse.UserDto.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .activeRoomId(user.getActiveRoomId())
                        .currentTeamId(user.getCurrentTeamId())
                        .build())
                .build();
    }

    // ── Logout ────────────────────────────────────────────────────────────────

    @Transactional
    public void logout(User user) {
        refreshTokenRepository.revokeAllByUserId(user.getId());
        log.info("User {} logged out, all refresh tokens revoked", user.getUsername());
    }

    // ── Change Password (authenticated) ───────────────────────────────────────

    @Transactional
    public void changePassword(User user, ChangePasswordRequest request) {
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new ApiException("WRONG_PASSWORD: Current password is incorrect", HttpStatus.BAD_REQUEST);
        }
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        // Revoke all refresh tokens to force re-login on other devices
        refreshTokenRepository.revokeAllByUserId(user.getId());
        log.info("Password changed for user {}", user.getUsername());
    }

    // ── Forgot Password ───────────────────────────────────────────────────────

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        // Always return success — never reveal whether email exists (security best practice)
        userRepository.findByEmail(request.getEmail().toLowerCase()).ifPresent(user -> {
            // Delete any previous unused codes
            passwordResetCodeRepository.deleteAllByUserId(user.getId());

            String code = generateNumericCode();
            PasswordResetCode prc = PasswordResetCode.builder()
                    .user(user)
                    .code(code)
                    .expiresAt(Instant.now().plusSeconds(resetCodeExpiryMinutes * 60))
                    .used(false)
                    .build();
            passwordResetCodeRepository.save(prc);
            emailService.sendForgotPasswordEmail(user.getEmail(), code);
        });
    }

    // ── Reset Password ────────────────────────────────────────────────────────

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new ApiException("INVALID_RESET_CODE: Invalid or expired reset code", HttpStatus.BAD_REQUEST));

        PasswordResetCode prc = passwordResetCodeRepository
                .findTopByUserIdAndUsedFalseOrderByCreatedAtDesc(user.getId())
                .orElseThrow(() -> new ApiException("INVALID_RESET_CODE: No active reset code found", HttpStatus.BAD_REQUEST));

        if (Instant.now().isAfter(prc.getExpiresAt())) {
            throw new ApiException("CODE_EXPIRED: Password reset code has expired — request a new one", HttpStatus.BAD_REQUEST);
        }
        if (!prc.getCode().equals(request.getCode())) {
            throw new ApiException("INVALID_RESET_CODE: Incorrect reset code", HttpStatus.BAD_REQUEST);
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Mark code used + revoke all refresh tokens (force re-login)
        prc.setUsed(true);
        passwordResetCodeRepository.save(prc);
        refreshTokenRepository.revokeAllByUserId(user.getId());

        log.info("Password reset successful for user {}", user.getEmail());
    }

    // ── Resend Verification ───────────────────────────────────────────────────

    @Transactional
    public void resendVerification(ResendRequest request) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new ApiException("USER_NOT_FOUND: No account with that email", HttpStatus.NOT_FOUND));

        if (user.isVerified()) {
            throw new ApiException("ALREADY_VERIFIED: Account is already verified", HttpStatus.BAD_REQUEST);
        }

        // Cooldown check
        verificationCodeRepository.findTopByUserIdOrderByCreatedAtDesc(user.getId()).ifPresent(vc -> {
            Instant lastSent = vc.getResentAt() != null ? vc.getResentAt() : vc.getCreatedAt();
            if (Instant.now().isBefore(lastSent.plusSeconds(cooldownSeconds))) {
                long secondsLeft = cooldownSeconds - (Instant.now().getEpochSecond() - lastSent.getEpochSecond());
                throw new ApiException(
                    "RESEND_COOLDOWN: Please wait " + secondsLeft + " seconds before requesting a new code",
                    HttpStatus.TOO_MANY_REQUESTS
                );
            }
        });

        // Delete old codes and create a fresh one
        verificationCodeRepository.deleteAllByUserId(user.getId());
        String code = generateNumericCode();
        VerificationCode vc = VerificationCode.builder()
                .user(user)
                .code(code)
                .expiresAt(Instant.now().plusSeconds(verifyCodeExpiryHours * 3600))
                .resentAt(Instant.now())
                .build();
        verificationCodeRepository.save(vc);
        emailService.sendVerificationEmail(user.getEmail(), code);
    }

    // ── Resend Password Reset ─────────────────────────────────────────────────

    @Transactional
    public void resendPasswordReset(ResendRequest request) {
        // Silent no-op if user not found (security — same as forgotPassword)
        userRepository.findByEmail(request.getEmail().toLowerCase()).ifPresent(user -> {
            // Cooldown check
            passwordResetCodeRepository
                    .findTopByUserIdAndUsedFalseOrderByCreatedAtDesc(user.getId())
                    .ifPresent(prc -> {
                        Instant lastSent = prc.getResentAt() != null ? prc.getResentAt() : prc.getCreatedAt();
                        if (Instant.now().isBefore(lastSent.plusSeconds(cooldownSeconds))) {
                            long secondsLeft = cooldownSeconds - (Instant.now().getEpochSecond() - lastSent.getEpochSecond());
                            throw new ApiException(
                                "RESEND_COOLDOWN: Please wait " + secondsLeft + " seconds before requesting a new code",
                                HttpStatus.TOO_MANY_REQUESTS
                            );
                        }
                    });

            // Delete old codes and issue a fresh one
            passwordResetCodeRepository.deleteAllByUserId(user.getId());
            String code = generateNumericCode();
            PasswordResetCode prc = PasswordResetCode.builder()
                    .user(user)
                    .code(code)
                    .expiresAt(Instant.now().plusSeconds(resetCodeExpiryMinutes * 60))
                    .resentAt(Instant.now())
                    .used(false)
                    .build();
            passwordResetCodeRepository.save(prc);
            emailService.sendForgotPasswordEmail(user.getEmail(), code);
        });
    }

    // ── Get Current User ──────────────────────────────────────────────────────

    public UserProfileResponse getProfile(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .isVerified(user.isVerified())
                .activeRoomId(user.getActiveRoomId())
                .currentTeamId(user.getCurrentTeamId())
                .profilePictureKey(user.getProfilePictureKey())
                .build();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Issues a fresh access + refresh token pair for a user.
     * Creates a new token family (new login session).
     */
    private AuthResponse issueTokenPair(User user) {
        String accessToken = jwtService.generateAccessToken(user.getId());
        String rawRefreshToken = jwtService.generateRawRefreshToken();

        RefreshToken rt = RefreshToken.builder()
                .user(user)
                .tokenHash(jwtService.hashRefreshToken(rawRefreshToken))
                .familyId(UUID.randomUUID())  // fresh family = new login session
                .revoked(false)
                .expiresAt(Instant.now().plusMillis(jwtService.getRefreshTokenExpirationMs()))
                .build();
        refreshTokenRepository.save(rt);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(rawRefreshToken)
                .user(AuthResponse.UserDto.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .activeRoomId(user.getActiveRoomId())
                        .currentTeamId(user.getCurrentTeamId())
                        .build())
                .build();
    }

    /** 6-digit zero-padded numeric code, same as MERN genCode() */
    private String generateNumericCode() {
        int code = 100000 + new Random().nextInt(900000);
        return String.valueOf(code);
    }
}
