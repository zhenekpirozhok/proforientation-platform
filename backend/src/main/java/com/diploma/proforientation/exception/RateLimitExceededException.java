package com.diploma.proforientation.exception;

import org.springframework.http.HttpStatus;

public class RateLimitExceededException extends ApiException {

    public static final String MESSAGE_KEY = "error.rate_limit_exceeded";

    public RateLimitExceededException() {
        super(MESSAGE_KEY, HttpStatus.TOO_MANY_REQUESTS);
    }

    public RateLimitExceededException(Object... args) {
        super(MESSAGE_KEY, HttpStatus.TOO_MANY_REQUESTS, args);
    }

    public RateLimitExceededException(Throwable cause, Object... args) {
        super(MESSAGE_KEY, HttpStatus.TOO_MANY_REQUESTS, cause, args);
    }
}