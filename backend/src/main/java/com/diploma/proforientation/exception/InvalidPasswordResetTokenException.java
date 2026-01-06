package com.diploma.proforientation.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when a password reset token is invalid or malformed.
 */
public class InvalidPasswordResetTokenException extends ApiException {

    public InvalidPasswordResetTokenException() {
        super("Invalid password reset token", HttpStatus.BAD_REQUEST);
    }
}