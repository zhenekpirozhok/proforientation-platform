package com.diploma.proforientation.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * A custom runtime exception for throwing API-specific errors with a custom HTTP status.
 */
@Getter
public class ApiException extends RuntimeException {
    private final HttpStatus status;
    private final String messageKey;
    private final transient Object[] args;

    public ApiException(String messageKey, HttpStatus status, Object... args) {
        super(messageKey);
        this.status = status;
        this.messageKey = messageKey;
        this.args = args;
    }

    public ApiException(String messageKey, HttpStatus status, Throwable cause, Object... args) {
        super(messageKey, cause);
        this.status = status;
        this.messageKey = messageKey;
        this.args = args;
    }
}