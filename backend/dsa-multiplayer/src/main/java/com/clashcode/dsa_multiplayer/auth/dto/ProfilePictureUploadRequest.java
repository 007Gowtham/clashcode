package com.clashcode.dsa_multiplayer.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request body for POST /api/users/{userId}/profile-picture/upload-url.
 * The client sends the MIME type of the image it intends to upload.
 */
public record ProfilePictureUploadRequest(
        @NotBlank(message = "contentType must not be blank")
        String contentType
) {}
