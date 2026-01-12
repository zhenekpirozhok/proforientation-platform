package com.diploma.proforientation.exception;

import org.springframework.http.HttpStatus;

import static com.diploma.proforientation.util.Constants.GOOGLE_TOKEN_VERIFICATION_FAILED;

/**
 * Thrown when Google token verification fails due to server/config/network issues.
 */
public class GoogleTokenVerificationFailedException extends ApiException {

    public GoogleTokenVerificationFailedException(Throwable cause) {
        super(
                GOOGLE_TOKEN_VERIFICATION_FAILED,
                HttpStatus.INTERNAL_SERVER_ERROR,
                cause
        );
    }
}