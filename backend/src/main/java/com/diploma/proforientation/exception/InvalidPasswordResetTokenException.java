package com.diploma.proforientation.exception;

import org.springframework.http.HttpStatus;

import static com.diploma.proforientation.util.Constants.INVALID_PASSWORD_RESET_TOKEN;

/**
 * Thrown when a password reset token is invalid or malformed.
 */
public class InvalidPasswordResetTokenException extends ApiException {

    public InvalidPasswordResetTokenException() {
        super(
                INVALID_PASSWORD_RESET_TOKEN,
                HttpStatus.BAD_REQUEST
        );
    }
}