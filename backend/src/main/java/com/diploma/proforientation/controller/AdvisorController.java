package com.diploma.proforientation.controller;

import com.diploma.proforientation.dto.ExceptionDto;
import com.diploma.proforientation.exception.ApiException;
import com.diploma.proforientation.exception.EmailNotFoundException;
import com.diploma.proforientation.exception.InvalidPasswordResetTokenException;
import com.diploma.proforientation.exception.ExpiredPasswordResetTokenException;
import com.diploma.proforientation.exception.UserNotFoundForPasswordResetException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.io.IOException;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Global exception handler that intercepts and processes exceptions thrown from controllers.
 *
 * <p>The purpose of this class is to centralize API error handling and ensure that
 * all errors follow a uniform structure defined by {@link ExceptionDto}.</p>
 *
 * <h2>Handled exceptions:</h2>
 * <ul>
 *     <li>{@link ApiException} – custom application error with dynamic status</li>
 *     <li>{@link MethodArgumentNotValidException} – validation errors</li>
 *     <li>{@link UsernameNotFoundException} – authentication-related errors</li>
 *     <li>{@link IllegalArgumentException}, {@link IllegalStateException} – bad input</li>
 *     <li>{@link IOException} – internal resource access errors</li>
 *     <li>{@link Exception} – fallback handler for unexpected errors</li>
 * </ul>
 */
@RestControllerAdvice
@Slf4j
public class AdvisorController {

    /**
     * Handles custom application-level exceptions with dynamic status codes.
     *
     * @param e the thrown {@link ApiException}
     * @return a structured error response with the provided status code
     */
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ExceptionDto> handleApiException(ApiException e) {
        log.error("API error: {}", e.getMessage(), e);
        return ResponseEntity.status(e.getStatus())
                .body(new ExceptionDto(e.getStatus().value(), Instant.now(), e.getMessage()));
    }

    /**
     * Handles Spring Security 6+ authorization failures.
     * <p>
     * This exception is thrown when:
     *  - a user is authenticated but does not have enough roles/permissions
     *  - @PreAuthorize(...) or method-level security denies access
     * <p>
     * It corresponds to HTTP 403 Forbidden.
     */
    @ExceptionHandler(org.springframework.security.authorization.AuthorizationDeniedException.class)
    public ResponseEntity<ExceptionDto> handleAuthorizationDenied(
            org.springframework.security.authorization.AuthorizationDeniedException e
    ) {
        log.warn("Authorization denied: {}", e.getMessage());

        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ExceptionDto(
                        HttpStatus.FORBIDDEN.value(),
                        Instant.now(),
                        "Access denied: insufficient permissions"
                ));
    }

    /**
     * Handles validation exceptions triggered by @Valid annotations.
     *
     * @param e the validation exception
     * @return an error response containing a map of invalid fields and messages
     */
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ExceptionDto> handleValidationExceptions(MethodArgumentNotValidException e) {
        log.error("Validation error: {}", e.getMessage());

        Map<String, String> errors = new HashMap<>();
        e.getBindingResult().getFieldErrors()
                .forEach(err -> errors.put(err.getField(), err.getDefaultMessage()));

        return ResponseEntity.badRequest()
                .body(new ExceptionDto(400, Instant.now(), errors));
    }

    /**
     * Handles authentication-related errors when a user is not found.
     *
     * @param e the UsernameNotFoundException
     * @return HTTP 401 Unauthorized response
     */
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<ExceptionDto> handleUsernameNotFound(UsernameNotFoundException e) {
        log.error("User not found: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ExceptionDto(401, Instant.now(), e.getMessage()));
    }

    /**
     * Handles invalid arguments or illegal states caused by incorrect input or logic errors.
     *
     * @param e the exception instance
     * @return HTTP 400 Bad Request response
     */
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<ExceptionDto> handleBadRequests(RuntimeException e) {
        log.error("Bad request: {}", e.getMessage());
        return ResponseEntity.badRequest()
                .body(new ExceptionDto(400, Instant.now(), e.getMessage()));
    }

    /**
     * Handles IO-related exceptions (e.g., file system errors, failing external resources).
     *
     * @param e the IOException instance
     * @return HTTP 500 Internal Server Error response
     */
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    @ExceptionHandler(IOException.class)
    public ResponseEntity<ExceptionDto> handleIOException(IOException e) {
        log.error("IO error: {}", e.getMessage(), e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ExceptionDto(500, Instant.now(), e.getMessage()));
    }

    /**
     * Handles cases where a password reset is requested for an email
     * that does not exist in the system.
     *
     * <p>This exception is thrown during the password reset initiation
     * process when a user enters an email address that is not registered.
     * </p>
     *
     * @param e the thrown {@link EmailNotFoundException}
     * @return a {@link ResponseEntity} containing an {@link ExceptionDto}
     *         with HTTP 404 (Not Found)
     */
    @ExceptionHandler(EmailNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ResponseEntity<ExceptionDto> handleEmailNotFound(EmailNotFoundException e) {
        log.error(e.getMessage(), e);
        ExceptionDto dto = new ExceptionDto(
                HttpStatus.NOT_FOUND.value(),
                Instant.now(),
                e.getMessage()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(dto);
    }

    /**
     * Handles cases where a provided password reset token is invalid.
     *
     * <p>This may occur when the token is malformed, does not match any
     * record in the database, or has already been used.</p>
     *
     * @param e the thrown {@link InvalidPasswordResetTokenException}
     * @return a {@link ResponseEntity} containing an {@link ExceptionDto}
     *         with HTTP 400 (Bad Request)
     */
    @ExceptionHandler(InvalidPasswordResetTokenException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<ExceptionDto> handleInvalidToken(InvalidPasswordResetTokenException e) {
        log.error(e.getMessage(), e);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ExceptionDto(400, Instant.now(), e.getMessage()));
    }


    /**
     * Handles cases where a password reset token has expired.
     *
     * <p>Tokens typically have a limited validity period for security reasons.
     * Attempting to use an expired token triggers this handler.</p>
     *
     * @param e the thrown {@link ExpiredPasswordResetTokenException}
     * @return a {@link ResponseEntity} containing an {@link ExceptionDto}
     *         with HTTP 400 (Bad Request)
     */
    @ExceptionHandler(ExpiredPasswordResetTokenException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<ExceptionDto> handleExpiredToken(ExpiredPasswordResetTokenException e) {
        log.error(e.getMessage(), e);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ExceptionDto(400, Instant.now(), e.getMessage()));
    }

    /**
     * Handles cases where a password reset token is valid, but the
     * corresponding user cannot be found in the system.
     *
     * <p>This situation may occur if the user was deleted after the token
     * was issued or if the token data became inconsistent.</p>
     *
     * @param e the thrown {@link UserNotFoundForPasswordResetException}
     * @return a {@link ResponseEntity} containing an {@link ExceptionDto}
     *         with HTTP 404 (Not Found)
     */
    @ExceptionHandler(UserNotFoundForPasswordResetException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ResponseEntity<ExceptionDto> handleUserNotFound(UserNotFoundForPasswordResetException e) {
        log.error(e.getMessage(), e);
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ExceptionDto(404, Instant.now(), e.getMessage()));
    }

    /**
     * A fallback handler for any unexpected exceptions not explicitly handled elsewhere.
     *
     * @param e the thrown exception
     * @return a generic HTTP 500 Internal Server Error response
     */
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ExceptionDto> handleUnexpected(Exception e) {
        log.error("Unexpected error: {}", e.getMessage(), e);

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ExceptionDto(
                        500,
                        Instant.now(),
                        "An unexpected error occurred"
                ));
    }
}