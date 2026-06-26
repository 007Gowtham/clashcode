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

@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApiException(ApiException ex) {
        log.error("API Exception occurred: {} | Status: {}", ex.getMessage(), ex.getStatus());
        return new ResponseEntity<>(new ErrorResponse(ex.getMessage()), ex.getStatus());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex) {
        String errorMessage = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));
        log.error("Validation error occurred: {}", errorMessage);
        return new ResponseEntity<>(new ErrorResponse("Validation failed: " + errorMessage), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoResourceFound(NoResourceFoundException ex) {
        log.error("Resource not found: {}", ex.getMessage());
        return new ResponseEntity<>(new ErrorResponse("Endpoint not found"), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception ex) {
        log.error("Unexpected error occurred: ", ex);
        return new ResponseEntity<>(new ErrorResponse("An internal server error occurred: " + ex.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
