package com.clashcode.dsa_multiplayer.auth.service;

import com.clashcode.dsa_multiplayer.common.exception.ApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;

import java.time.Duration;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * S3Service — generates presigned PUT/GET URLs for profile pictures.
 *
 * <p>The file bytes never touch this backend. The client uploads directly to S3
 * via a presigned PUT URL, then calls /confirm so we can persist the key.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class S3Service {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    /** Maps MIME type → file extension used in the S3 key. */
    private static final Map<String, String> CONTENT_TYPE_TO_EXT = Map.of(
            "image/jpeg", "jpg",
            "image/png",  "png",
            "image/webp", "webp"
    );

    private static final Duration UPLOAD_URL_TTL = Duration.ofMinutes(5);
    private static final Duration VIEW_URL_TTL   = Duration.ofMinutes(15);

    private final S3Presigner s3Presigner;

    @Value("${app.s3.bucket}")
    private String bucketName;

    // ─────────────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Generates a presigned PUT URL so the client can upload directly to S3.
     *
     * @param userId      the user performing the upload (used in key prefix)
     * @param contentType MIME type of the image — must be jpeg / png / webp
     * @return a {@link PresignedUploadResult} containing the upload URL and the
     *         server-generated S3 key that the client must pass back in /confirm
     */
    public PresignedUploadResult generateUploadUrl(UUID userId, String contentType) {
        validateContentType(contentType);

        String ext = CONTENT_TYPE_TO_EXT.get(contentType);
        String key = "profile-pictures/" + userId + "/" + UUID.randomUUID() + "." + ext;

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(contentType)
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(UPLOAD_URL_TTL)
                .putObjectRequest(putObjectRequest)
                .build();

        String uploadUrl = s3Presigner
                .presignPutObject(presignRequest)
                .url()
                .toString();

        log.info("Generated presigned PUT URL for user={} key={}", userId, key);
        return new PresignedUploadResult(uploadUrl, key);
    }

    /**
     * Generates a presigned GET URL so the client can display the profile picture.
     *
     * @param key the S3 object key previously returned from {@link #generateUploadUrl}
     *            and persisted on the User record
     * @return a short-lived (15 min) URL the frontend can use directly in an img src
     */
    public String generateViewUrl(String key) {
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(VIEW_URL_TTL)
                .getObjectRequest(getObjectRequest)
                .build();

        String viewUrl = s3Presigner
                .presignGetObject(presignRequest)
                .url()
                .toString();

        log.debug("Generated presigned GET URL for key={}", key);
        return viewUrl;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────────────────────────────────

    private void validateContentType(String contentType) {
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new ApiException(
                    "INVALID_CONTENT_TYPE: Only image/jpeg, image/png, and image/webp are accepted",
                    HttpStatus.BAD_REQUEST
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Value object
    // ─────────────────────────────────────────────────────────────────────────

    public record PresignedUploadResult(String uploadUrl, String key) {}
}
