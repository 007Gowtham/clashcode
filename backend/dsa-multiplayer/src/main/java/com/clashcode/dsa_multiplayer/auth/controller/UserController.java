package com.clashcode.dsa_multiplayer.auth.controller;

import com.clashcode.dsa_multiplayer.auth.dto.ProfilePictureConfirmRequest;
import com.clashcode.dsa_multiplayer.auth.dto.ProfilePictureUploadRequest;
import com.clashcode.dsa_multiplayer.auth.service.S3Service;
import com.clashcode.dsa_multiplayer.auth.service.UserService;
import com.clashcode.dsa_multiplayer.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * UserController — profile-picture presigned URL endpoints.
 *
 * <p>All responses use the unified {@link ApiResponse} wrapper, consistent with
 * the rest of the codebase. Errors are handled by GlobalExceptionHandler.</p>
 *
 * <pre>
 * POST /api/users/{userId}/profile-picture/upload-url
 *   Body:    { "contentType": "image/jpeg" }
 *   Returns: { status, success, message, data: { uploadUrl, key } }
 *
 * POST /api/users/{userId}/profile-picture/confirm
 *   Body:    { "key": "profile-pictures/&lt;userId&gt;/&lt;uuid&gt;.jpg" }
 *   Returns: { status, success, message }
 *
 * GET /api/users/{userId}/profile-picture
 *   Returns: { status, success, message, data: { viewUrl } }
 * </pre>
 */
@RestController
@RequestMapping("/api/users/{userId}/profile-picture")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ─────────────────────────────────────────────────────────────────────────
    // Step 1 — client asks for a presigned PUT URL
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * POST /api/users/{userId}/profile-picture/upload-url
     *
     * <p>Returns a presigned PUT URL (5-minute TTL) and the server-generated S3 key.
     * The client must use Content-Type exactly as supplied when calling S3,
     * then pass {@code key} back in the /confirm call.</p>
     */
    @PostMapping("/upload-url")
    public ResponseEntity<ApiResponse<Map<String, String>>> getUploadUrl(
            @PathVariable UUID userId,
            @Valid @RequestBody ProfilePictureUploadRequest request) {

        S3Service.PresignedUploadResult result =
                userService.getUploadUrl(userId, request.contentType());

        Map<String, String> data = Map.of(
                "uploadUrl", result.uploadUrl(),
                "key",       result.key()
        );

        return ResponseEntity.ok(ApiResponse.ok(
                "Presigned upload URL generated — expires in 5 minutes. " +
                "Use HTTP PUT with the exact Content-Type header to upload directly to S3, " +
                "then call /confirm with the returned key.",
                data
        ));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 2 — client confirms the direct S3 upload succeeded
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * POST /api/users/{userId}/profile-picture/confirm
     *
     * <p>The client calls this after a successful direct PUT to S3.
     * Persists the S3 key on the user record so future GET requests can
     * generate a view URL.</p>
     */
    @PostMapping("/confirm")
    public ResponseEntity<ApiResponse<Void>> confirmUpload(
            @PathVariable UUID userId,
            @Valid @RequestBody ProfilePictureConfirmRequest request) {

        userService.confirmUpload(userId, request.key());

        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .status(200)
                .success(true)
                .message("Profile picture key saved successfully")
                .build());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 3 — client fetches a view URL to display the picture
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * GET /api/users/{userId}/profile-picture
     *
     * <p>Returns a fresh presigned GET URL (15-minute TTL).
     * The frontend should request a fresh URL each time it needs to display the image
     * rather than caching the signed URL long-term.</p>
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, String>>> getViewUrl(
            @PathVariable UUID userId) {

        String viewUrl = userService.getViewUrl(userId);

        return ResponseEntity.ok(ApiResponse.ok(
                "Presigned view URL generated — expires in 15 minutes",
                Map.of("viewUrl", viewUrl)
        ));
    }
}
