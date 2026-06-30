package com.clashcode.dsa_multiplayer.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request body for POST /api/users/{userId}/profile-picture/confirm.
 * The client sends back the exact S3 key it received from the upload-url response,
 * confirming that the direct S3 PUT was successful.
 */
public record ProfilePictureConfirmRequest(
        @NotBlank(message = "key must not be blank")
        String key
) {}
