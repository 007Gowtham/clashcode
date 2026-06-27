package com.clashcode.dsa_multiplayer.common.exception;

import com.clashcode.dsa_multiplayer.common.response.ErrorResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.stream.Collectors;

/**
 * GlobalExceptionHandler — converts all exceptions into the unified response shape:
 *
 * {
 *   "status":  400,
 *   "success": false,
 *   "message": "Human-readable description",
 *   "error":   "ERROR_CODE"
 * }
 */
@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {

    /**
     * ApiException — thrown explicitly from service layer with a specific HTTP status.
     * Message format: "ERROR_CODE: Human-readable description"
     * e.g. "INVALID_CODE: Incorrect verification code"
     */
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApiException(ApiException ex) {
        int statusCode = ex.getStatus().value();
        log.warn("ApiException [{}]: {}", statusCode, ex.getMessage());
        return ResponseEntity
                .status(ex.getStatus())
                .body(new ErrorResponse(statusCode, ex.getMessage()));
    }

    /**
     * Bean validation failure — @Valid on request DTOs.
     * Collects all field errors into a single message string.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        String fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));
        log.warn("Validation failed: {}", fieldErrors);

        ErrorResponse body = new ErrorResponse();
        body.setStatus(400);
        body.setSuccess(false);
        body.setError("VALIDATION_ERROR");
        body.setMessage(fieldErrors);
        return ResponseEntity.badRequest().body(body);
    }

    /**
     * 404 for unknown endpoints — keeps response consistent (no Spring whitepage).
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(NoResourceFoundException ex) {
        log.debug("Endpoint not found: {}", ex.getMessage());
        ErrorResponse body = new ErrorResponse();
        body.setStatus(404);
        body.setSuccess(false);
        body.setError("NOT_FOUND");
        body.setMessage("The requested endpoint does not exist");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    /**
     * Catch-all — never expose internal stack traces to clients.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(Exception ex) {
        log.error("Unhandled exception: ", ex);
        ErrorResponse body = new ErrorResponse();
        body.setStatus(500);
        body.setSuccess(false);
        body.setError("INTERNAL_ERROR");
        body.setMessage("An unexpected error occurred. Please try again later.");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
