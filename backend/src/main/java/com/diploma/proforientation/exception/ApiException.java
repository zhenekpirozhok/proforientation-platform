package com.diploma.proforientation.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * A custom runtime exception for throwing API-specific errors with a custom HTTP status.
 */
@Getter
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    /**
     * Creates a new API exception.
     *
     * @param message the error message
     * @param status  the HTTP status to return
     */
    public ApiException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public ApiException(String message, HttpStatus status, Throwable cause) {
        super(message, cause);
        this.status = status;
    }
}