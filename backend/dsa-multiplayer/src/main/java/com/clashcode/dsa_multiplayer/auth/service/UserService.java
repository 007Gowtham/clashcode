package com.clashcode.dsa_multiplayer.auth.service;

import com.clashcode.dsa_multiplayer.auth.entity.User;
import com.clashcode.dsa_multiplayer.auth.repository.UserRepository;
import com.clashcode.dsa_multiplayer.common.exception.ApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * UserService — business logic for profile-picture operations.
 *
 * <p>Intentionally thin: actual S3 interactions are delegated to S3Service.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final S3Service s3Service;

    // ─────────────────────────────────────────────────────────────────────────
    // Upload URL
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Returns a presigned PUT URL and a server-generated S3 key.
     * The client must use these to upload directly to S3 (bytes never pass here).
     *
     * @param userId      target user; must exist
     * @param contentType image MIME type (validated inside S3Service)
     */
    public S3Service.PresignedUploadResult getUploadUrl(UUID userId, String contentType) {
        ensureUserExists(userId);
        return s3Service.generateUploadUrl(userId, contentType);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Confirm upload — persist the key after the client's direct S3 PUT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Persists the S3 key on the User record after the client confirms a
     * successful direct upload to S3.
     *
     * @param userId target user; must exist
     * @param key    the S3 key exactly as returned by {@link #getUploadUrl}
     */
    @Transactional
    public void confirmUpload(UUID userId, String key) {
        if (key == null || key.isBlank()) {
            throw new ApiException(
                    "MISSING_KEY: The S3 key must not be blank",
                    HttpStatus.BAD_REQUEST
            );
        }
        // Basic sanity: the key must start with the user's own prefix to prevent
        // one user from claiming another user's uploaded object.
        String expectedPrefix = "profile-pictures/" + userId + "/";
        if (!key.startsWith(expectedPrefix)) {
            throw new ApiException(
                    "INVALID_KEY: The provided key does not belong to this user",
                    HttpStatus.BAD_REQUEST
            );
        }

        User user = findUserById(userId);
        user.setProfilePictureKey(key);
        userRepository.save(user);
        log.info("Persisted profile picture key for userId={}", userId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // View URL
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Generates a fresh presigned GET URL from the stored S3 key.
     *
     * @param userId target user; must exist and must have a profile picture set
     * @return a short-lived URL the frontend can use as an img src
     */
    public String getViewUrl(UUID userId) {
        User user = findUserById(userId);
        String key = user.getProfilePictureKey();
        if (key == null || key.isBlank()) {
            throw new ApiException(
                    "NO_PROFILE_PICTURE: This user has not uploaded a profile picture yet",
                    HttpStatus.NOT_FOUND
            );
        }
        return s3Service.generateViewUrl(key);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Shared helpers
    // ─────────────────────────────────────────────────────────────────────────

    private User findUserById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(
                        "USER_NOT_FOUND: No user found with id " + userId,
                        HttpStatus.NOT_FOUND
                ));
    }

    private void ensureUserExists(UUID userId) {
        if (!userRepository.existsById(userId)) {
            throw new ApiException(
                    "USER_NOT_FOUND: No user found with id " + userId,
                    HttpStatus.NOT_FOUND
            );
        }
    }
}
