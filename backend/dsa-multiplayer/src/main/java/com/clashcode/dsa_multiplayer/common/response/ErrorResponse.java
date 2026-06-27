package com.clashcode.dsa_multiplayer.common.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Kept for backward-compat use inside GlobalExceptionHandler.
 * Delegates to the ApiResponse error shape — both produce the same JSON structure.
 *
 * {
 *   "status":  400,
 *   "success": false,
 *   "message": "Human-readable description",
 *   "error":   "ERROR_CODE"
 * }
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {
    private int status;
    private boolean success = false;
    private String message;
    private String error;

    /** Convenience constructor: splits "ERROR_CODE: human message" string */
    public ErrorResponse(int status, String raw) {
        this.status  = status;
        this.success = false;
        if (raw != null && raw.contains(": ")) {
            int idx      = raw.indexOf(": ");
            this.error   = raw.substring(0, idx);
            this.message = raw.substring(idx + 2);
        } else {
            this.error   = "ERROR";
            this.message = raw;
        }
    }
}
