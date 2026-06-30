package com.clashcode.dsa_multiplayer.auth.controller;

import com.clashcode.dsa_multiplayer.auth.dto.*;
import com.clashcode.dsa_multiplayer.auth.entity.User;
import com.clashcode.dsa_multiplayer.auth.service.AuthService;
import com.clashcode.dsa_multiplayer.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * AuthController — all responses use the unified ApiResponse shape:
 *
 * Success:
 * {
 *   "status":  200,
 *   "success": true,
 *   "message": "...",
 *   "data":    { ... }
 * }
 *
 * Errors are handled by GlobalExceptionHandler (ApiException → ErrorResponse).
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // ────────────────────────────────────────────────────────────────────────
    // PUBLIC ENDPOINTS (no JWT required)
    // ────────────────────────────────────────────────────────────────────────

    /** POST /auth/register */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.<Void>builder()
                        .status(201)
                        .success(true)
                        .message("Registration successful — check your email for a 6-digit verification code")
                        .build());
    }

    /** POST /auth/verify */
    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<Void>> verify(@Valid @RequestBody VerifyRequest request) {
        authService.verifyEmail(request);
        return ResponseEntity.ok(
            ApiResponse.<Void>builder()
                .status(200).success(true)
                .message("Email verified successfully — please log in with your credentials")
                .build()
        );
    }

    /** POST /auth/login */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse data = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", data));
    }

    /** POST /auth/refresh — silent access-token rotation */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse data = authService.refresh(request);
        return ResponseEntity.ok(ApiResponse.ok("Token refreshed", data));
    }

    /** POST /auth/forgot-password */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        // Always the same message — never reveal whether the email exists
        return ResponseEntity.ok(
            ApiResponse.<Void>builder()
                .status(200).success(true)
                .message("If an account exists with that email, a reset code has been sent (valid 15 minutes)")
                .build()
        );
    }

    /** POST /auth/reset-password */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(
            ApiResponse.<Void>builder()
                .status(200).success(true)
                .message("Password reset successfully — please log in with your new password")
                .build()
        );
    }

    /** POST /auth/resend-verification */
    @PostMapping("/resend-verification")
    public ResponseEntity<ApiResponse<Void>> resendVerification(@Valid @RequestBody ResendRequest request) {
        authService.resendVerification(request);
        return ResponseEntity.ok(
            ApiResponse.<Void>builder()
                .status(200).success(true)
                .message("Verification code resent — check your email")
                .build()
        );
    }

    /** POST /auth/resend-reset-password */
    @PostMapping("/resend-reset-password")
    public ResponseEntity<ApiResponse<Void>> resendResetPassword(@Valid @RequestBody ResendRequest request) {
        authService.resendPasswordReset(request);
        return ResponseEntity.ok(
            ApiResponse.<Void>builder()
                .status(200).success(true)
                .message("If an account exists with that email, a new reset code has been sent")
                .build()
        );
    }

    // ────────────────────────────────────────────────────────────────────────
    // PROTECTED ENDPOINTS (valid JWT required)
    // ────────────────────────────────────────────────────────────────────────

    /** POST /auth/logout */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@AuthenticationPrincipal User user) {
        authService.logout(user);
        return ResponseEntity.ok(
            ApiResponse.<Void>builder()
                .status(200).success(true)
                .message("Logged out successfully — all sessions revoked")
                .build()
        );
    }

    /** GET /auth/me */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> me(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok("User profile", authService.getProfile(user)));
    }

    /** POST /auth/change-password — requires valid JWT; verifies old password before updating */
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(user, request);
        return ResponseEntity.ok(
            ApiResponse.<Void>builder()
                .status(200).success(true)
                .message("Password changed successfully — you will need to log in again on other devices")
                .build()
        );
    }
}
