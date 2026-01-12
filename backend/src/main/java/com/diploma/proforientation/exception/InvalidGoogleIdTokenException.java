package com.diploma.proforientation.exception;


import org.springframework.http.HttpStatus;

import static com.diploma.proforientation.util.Constants.INVALID_GOOGLE_ID_TOKEN;

/**
 * Thrown when Google ID token is invalid or cannot be verified.
 */
public class InvalidGoogleIdTokenException extends ApiException {

    public InvalidGoogleIdTokenException() {
        super(
                INVALID_GOOGLE_ID_TOKEN,
                HttpStatus.UNAUTHORIZED
        );
    }
}