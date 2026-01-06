package com.diploma.proforientation.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when Google token verification fails due to server/config/network issues.
 */
public class GoogleTokenVerificationFailedException extends ApiException {
    public GoogleTokenVerificationFailedException(Throwable cause) {
        super("Failed to verify Google ID token", HttpStatus.INTERNAL_SERVER_ERROR);
        initCause(cause);
    }
}