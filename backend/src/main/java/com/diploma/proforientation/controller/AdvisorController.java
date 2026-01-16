package com.diploma.proforientation.controller;

import com.diploma.proforientation.dto.ExceptionDto;
import com.diploma.proforientation.exception.ApiException;
import com.diploma.proforientation.util.I18n;
import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
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

import java.io.IOException;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import static com.diploma.proforientation.util.Constants.*;

@RestControllerAdvice
@Slf4j
public class AdvisorController {

    private final I18n i18n;

    public AdvisorController(I18n i18n) {
        this.i18n = i18n;
    }

    /** Treat message as key only when it looks like a key; otherwise fallbackKey. */
    private String resolveMsgOrFallback(String msgOrKey, String fallbackKey, Object... args) {
        boolean looksLikeKey = msgOrKey != null && (msgOrKey.startsWith("error.") || msgOrKey.startsWith("email."));
        String keyToUse = looksLikeKey ? msgOrKey : fallbackKey;

        String localized = i18n.msg(keyToUse, args);

        if (localized.equals(keyToUse)) {
            localized = i18n.msg(fallbackKey, args);
        }
        return localized;
    }

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ExceptionDto> handleApiException(ApiException e) {
        log.error("API error: key={}, status={}", e.getMessageKey(), e.getStatus(), e);
        String message = i18n.msg(e.getMessageKey(), e.getArgs());
        return ResponseEntity.status(e.getStatus())
                .body(new ExceptionDto(e.getStatus().value(), Instant.now(), message));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ExceptionDto> handleValidationExceptions(MethodArgumentNotValidException e) {
        log.error("Validation error: {}", e.getMessage());

        Map<String, String> errors = new HashMap<>();
        e.getBindingResult().getFieldErrors().forEach(err -> {
            String defaultMsg = err.getDefaultMessage();
            String localized = (defaultMsg != null && defaultMsg.startsWith("error."))
                    ? i18n.msg(defaultMsg)
                    : defaultMsg;
            errors.put(err.getField(), localized);
        });

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ExceptionDto(400, Instant.now(), errors));
    }

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<ExceptionDto> handleBadRequests(RuntimeException e) {
        log.error("Bad request: {}", e.getMessage(), e);

        String msgOrKey = e.getMessage();
        String message = (msgOrKey != null && msgOrKey.startsWith("error."))
                ? i18n.msg(msgOrKey)
                : msgOrKey;

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ExceptionDto(400, Instant.now(), message));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ExceptionDto> handleNotReadable(HttpMessageNotReadableException e) {
        log.error("Malformed JSON: {}", e.getMessage(), e);
        String message = resolveMsgOrFallback(e.getMessage(), ERROR_MALFORMED_JSON);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ExceptionDto(400, Instant.now(), message));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ExceptionDto> handleMissingParam(MissingServletRequestParameterException e) {
        String message = resolveMsgOrFallback(
                e.getMessage(),
                ERROR_MISSING_PARAMETER,
                e.getParameterName()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ExceptionDto(400, Instant.now(), message));
    }

    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<ExceptionDto> handleMissingHeader(MissingRequestHeaderException e) {
        String message = resolveMsgOrFallback(
                e.getMessage(),
                ERROR_MISSING_HEADER,
                e.getHeaderName()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ExceptionDto(400, Instant.now(), message));
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<ExceptionDto> handleMissingPart(MissingServletRequestPartException e) {
        String message = resolveMsgOrFallback(
                e.getMessage(),
                ERROR_MISSING_MULTIPART_PART,
                e.getRequestPartName()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ExceptionDto(400, Instant.now(), message));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ExceptionDto> handleTypeMismatch(MethodArgumentTypeMismatchException e) {
        String message = resolveMsgOrFallback(
                e.getMessage(),
                ERROR_INVALID_PARAMETER_VALUE,
                e.getName(),
                String.valueOf(e.getValue())
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ExceptionDto(400, Instant.now(), message));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ExceptionDto> handleBadCredentials(BadCredentialsException e) {
        log.warn("Bad credentials", e);
        String message = resolveMsgOrFallback(e.getMessage(), INVALID_CREDENTIALS);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ExceptionDto(401, Instant.now(), message));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ExceptionDto> handleAuthentication(AuthenticationException e) {
        log.warn("Authentication failed", e);
        String message = resolveMsgOrFallback(e.getMessage(), ERROR_UNAUTHORIZED);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ExceptionDto(401, Instant.now(), message));
    }

    @ExceptionHandler(org.springframework.security.authorization.AuthorizationDeniedException.class)
    public ResponseEntity<ExceptionDto> handleAuthorizationDenied(
            org.springframework.security.authorization.AuthorizationDeniedException e
    ) {
        log.warn("Authorization denied", e);
        String message = resolveMsgOrFallback(e.getMessage(), ERROR_ACCESS_DENIED);
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ExceptionDto(403, Instant.now(), message));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ExceptionDto> handleAccessDenied(AccessDeniedException e) {
        log.warn("Access denied", e);
        String message = resolveMsgOrFallback(e.getMessage(), ERROR_ACCESS_DENIED);
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ExceptionDto(403, Instant.now(), message));
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ExceptionDto> handleEntityNotFound(EntityNotFoundException e) {
        log.error("Entity not found", e);
        String message = resolveMsgOrFallback(e.getMessage(), ERROR_ENTITY_NOT_FOUND);
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ExceptionDto(404, Instant.now(), message));
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ExceptionDto> handleNoHandlerFound(NoHandlerFoundException e) {
        log.warn("No handler found: {}", e.getRequestURL(), e);
        String message = resolveMsgOrFallback(e.getMessage(), ERROR_ENDPOINT_NOT_FOUND);
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ExceptionDto(404, Instant.now(), message));
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ExceptionDto> handleMethodNotSupported(HttpRequestMethodNotSupportedException e) {
        log.warn("Method not supported", e);
        String message = resolveMsgOrFallback(e.getMessage(), ERROR_METHOD_NOT_ALLOWED);
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(new ExceptionDto(405, Instant.now(), message));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ExceptionDto> handleDataIntegrity(DataIntegrityViolationException e) {
        log.error("Data integrity violation", e);
        String message = resolveMsgOrFallback(e.getMessage(), ERROR_DATA_INTEGRITY);
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ExceptionDto(409, Instant.now(), message));
    }

    @ExceptionHandler(IOException.class)
    public ResponseEntity<ExceptionDto> handleIOException(IOException e) {
        log.error("IO error", e);
        String message = resolveMsgOrFallback(e.getMessage(), ERROR_IO);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ExceptionDto(500, Instant.now(), message));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ExceptionDto> handleUnexpected(Exception e) {
        log.error("Unexpected error", e);
        String message = resolveMsgOrFallback(e.getMessage(), ERROR_UNEXPECTED);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ExceptionDto(500, Instant.now(), message));
    }
}