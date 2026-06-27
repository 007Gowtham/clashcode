package com.clashcode.dsa_multiplayer.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

/**
 * Unified API response wrapper.
 *
 * Success shape:
 * {
 *   "status":  201,
 *   "success": true,
 *   "message": "User registered successfully",
 *   "data":    { ... }          // null for void operations
 * }
 *
 * Error shape (from GlobalExceptionHandler):
 * {
 *   "status":  400,
 *   "success": false,
 *   "message": "Incorrect verification code",
 *   "error":   "INVALID_CODE"
 * }
 */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private final int status;
    private final boolean success;
    private final String message;
    private final T data;
    private final String error;   // error code string, present only on failures

    // ── Factory helpers ──────────────────────────────────────────────────────

    public static <T> ApiResponse<T> ok(String message, T data) {
        return ApiResponse.<T>builder()
                .status(200)
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> created(String message, T data) {
        return ApiResponse.<T>builder()
                .status(201)
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    public static ApiResponse<Void> ok(String message) {
        return ApiResponse.<Void>builder()
                .status(200)
                .success(true)
                .message(message)
                .build();
    }

    public static ApiResponse<Void> error(int status, String errorCode, String message) {
        return ApiResponse.<Void>builder()
                .status(status)
                .success(false)
                .message(message)
                .error(errorCode)
                .build();
    }
}
