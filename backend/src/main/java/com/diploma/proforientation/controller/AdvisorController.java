package com.diploma.proforientation.controller;

import com.diploma.proforientation.dto.ExceptionDto;
import com.diploma.proforientation.exception.ApiException;
import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.security.access.AccessDeniedException;

import java.io.IOException;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Global REST exception handler for the application.
 *
 * <p>
 * This controller advice centralizes handling of all exceptions thrown by REST controllers
 * and service layers, converting them into consistent, structured HTTP responses.
 * </p>
 *
 * <p>
 * All error responses follow a unified format defined by {@link ExceptionDto},
 * which includes:
 * <ul>
 *     <li>HTTP status code</li>
 *     <li>timestamp of the error</li>
 *     <li>human-readable error message or validation details</li>
 * </ul>
 * </p>
 *
 * <p>
 * The handler covers:
 * <ul>
 *     <li><b>Application-specific errors</b> via {@link ApiException} with dynamic HTTP statuses</li>
 *     <li><b>Validation errors</b> triggered by {@code @Valid} and {@code @Validated}</li>
 *     <li><b>Authentication errors</b> (invalid credentials, unauthorized access)</li>
 *     <li><b>Authorization errors</b> (insufficient permissions)</li>
 *     <li><b>Request errors</b> (missing parameters, headers, malformed JSON, type mismatches)</li>
 *     <li><b>Persistence errors</b> (entity not found, constraint violations)</li>
 *     <li><b>Infrastructure errors</b> (I/O failures, external resource issues)</li>
 *     <li><b>Fallback handling</b> for unexpected or uncaught exceptions</li>
 * </ul>
 * </p>
 *
 * <p>
 * This approach ensures:
 * <ul>
 *     <li>Consistent API error contracts</li>
 *     <li>Clear and user-friendly error messages for clients</li>
 *     <li>Separation of error handling from business logic</li>
 *     <li>Centralized logging and easier debugging</li>
 * </ul>
 * </p>
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
     * Handles validation exceptions triggered by @Valid annotations.
     *
     * @param e the validation exception
     * @return an error response containing a map of invalid fields and messages
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ExceptionDto> handleValidationExceptions(MethodArgumentNotValidException e) {
        log.error("Validation error: {}", e.getMessage());

        Map<String, String> errors = new HashMap<>();
        e.getBindingResult().getFieldErrors()
                .forEach(err -> errors.put(err.getField(), err.getDefaultMessage()));

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ExceptionDto(400, Instant.now(), errors));
    }

    /**
     * Handles invalid arguments or illegal states caused by incorrect input or logic errors.
     *
     * @param e the exception instance
     * @return HTTP 400 Bad Request response
     */
    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<ExceptionDto> handleBadRequests(RuntimeException e) {
        log.error("Bad request: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ExceptionDto(400, Instant.now(), e.getMessage()));
    }

    /**
     * Handles malformed JSON / unreadable request body.
     *
     * <p>
     * Example: invalid JSON syntax, wrong types, missing quotes, etc.
     * </p>
     *
     * @param e request body parsing exception
     * @return 400 Bad Request with a user-friendly message
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ExceptionDto> handleNotReadable(HttpMessageNotReadableException e) {
        log.error("Malformed JSON: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ExceptionDto(400, Instant.now(), "Malformed JSON request"));
    }

    /**
     * Handles missing query/form parameters.
     *
     * <p>
     * Example: ?page= is required but not provided.
     * </p>
     *
     * @param e missing parameter exception
     * @return 400 Bad Request
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ExceptionDto> handleMissingParam(MissingServletRequestParameterException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ExceptionDto(400, Instant.now(), "Missing parameter: " + e.getParameterName()));
    }

    /**
     * Handles missing required HTTP headers.
     *
     * <p>
     * Example: missing Authorization header, missing custom header like X-Client-Id, etc.
     * </p>
     *
     * @param e missing header exception
     * @return 400 Bad Request
     */
    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<ExceptionDto> handleMissingHeader(MissingRequestHeaderException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ExceptionDto(400, Instant.now(), "Missing header: " + e.getHeaderName()));
    }

    /**
     * Handles missing multipart parts in multipart/form-data requests.
     *
     * <p>
     * Example: file part is required but not sent.
     * </p>
     *
     * @param e missing multipart part exception
     * @return 400 Bad Request
     */
    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<ExceptionDto> handleMissingPart(MissingServletRequestPartException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ExceptionDto(400, Instant.now(), "Missing multipart part: " + e.getRequestPartName()));
    }

    /**
     * Handles type mismatch in request parameters/path variables.
     *
     * <p>
     * Example: /users/abc when "abc" cannot be converted into Long.
     * </p>
     *
     * @param e type mismatch exception
     * @return 400 Bad Request with a clear message
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ExceptionDto> handleTypeMismatch(MethodArgumentTypeMismatchException e) {
        String msg = "Invalid value for parameter '" + e.getName() + "': " + e.getValue();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ExceptionDto(400, Instant.now(), msg));
    }


    /**
     * Handles authentication failures caused by invalid user credentials.
     *
     * <p>
     * This exception is typically thrown during login when the provided
     * username/email or password is incorrect.
     * </p>
     *
     * <p>
     * The handler returns HTTP 401 (Unauthorized) with a concrete error message,
     * allowing the client to distinguish invalid credentials from other
     * authentication errors.
     * </p>
     *
     * @param e the {@link BadCredentialsException} thrown by Spring Security
     * @return a {@link ResponseEntity} containing an {@link ExceptionDto}
     *         with HTTP 401 Unauthorized
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ExceptionDto> handleBadCredentials(BadCredentialsException e) {
        log.warn("Bad credentials: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ExceptionDto(401, Instant.now(), e.getMessage()));
    }

    /**
     * Handles general authentication failures.
     *
     * <p>
     * Examples: bad credentials, invalid/expired JWT, etc. (depends on your security config).
     * </p>
     *
     * @param e authentication exception
     * @return 401 Unauthorized with generic message
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ExceptionDto> handleAuthentication(AuthenticationException e) {
        log.warn("Authentication failed: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ExceptionDto(401, Instant.now(), "Unauthorized"));
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
     * Handles access denied errors.
     *
     * @param e access denied exception
     * @return 403 Forbidden
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ExceptionDto> handleAccessDenied(AccessDeniedException e) {
        log.warn("Access denied: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ExceptionDto(403, Instant.now(), "Access denied"));
    }

    /**
     * Handles JPA "entity not found" errors.
     *
     * <p>
     * This can happen when a lazy proxy is accessed but the row doesn't exist,
     * or when getReferenceById() is used and entity is missing.
     * </p>
     *
     * @param e entity not found exception
     * @return 404 Not Found
     */
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ExceptionDto> handleEntityNotFound(EntityNotFoundException e) {
        log.error("Entity not found: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ExceptionDto(404, Instant.now(), e.getMessage()));
    }

    /**
     * Handles requests to non-existing endpoints.
     *
     * <p>
     * This handler will work only if Spring is configured to throw NoHandlerFoundException.
     * </p>
     *
     * @param e no handler found exception
     * @return 404 Not Found
     */
    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ExceptionDto> handleNoHandlerFound(NoHandlerFoundException e) {
        log.warn("No handler found: {}", e.getRequestURL());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ExceptionDto(404, Instant.now(), "Endpoint not found"));
    }

    /**
     * Handles HTTP method mismatch.
     *
     * <p>
     * Example: calling POST on a GET-only endpoint.
     * </p>
     *
     * @param e method not supported exception
     * @return 405 Method Not Allowed
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ExceptionDto> handleMethodNotSupported(HttpRequestMethodNotSupportedException e) {
        log.warn("Method not supported: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(new ExceptionDto(405, Instant.now(), e.getMessage()));
    }

    /**
     * Handles database constraint / integrity errors.
     *
     * <p>
     * Common scenarios:
     * <ul>
     *     <li>unique constraint violation (email already exists)</li>
     *     <li>foreign key constraint violation</li>
     * </ul>
     * </p>
     *
     * @param e data integrity exception
     * @return 409 Conflict
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ExceptionDto> handleDataIntegrity(DataIntegrityViolationException e) {
        log.error("Data integrity violation: {}", e.getMostSpecificCause().getMessage(), e);
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ExceptionDto(409, Instant.now(), "Data integrity violation"));
    }

    /**
     * Handles IO-related exceptions (e.g., file system errors, failing external resources).
     *
     * @param e the IOException instance
     * @return HTTP 500 Internal Server Error response
     */
    @ExceptionHandler(IOException.class)
    public ResponseEntity<ExceptionDto> handleIOException(IOException e) {
        log.error("IO error: {}", e.getMessage(), e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ExceptionDto(500, Instant.now(), e.getMessage()));
    }

    /**
     * A fallback handler for any unexpected exceptions not explicitly handled elsewhere.
     *
     * @param e the thrown exception
     * @return a generic HTTP 500 Internal Server Error response
     */
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