package com.diploma.proforientation.exception;

import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;

/**
 * Thrown when a password reset token has expired.
 */
public class ExpiredPasswordResetTokenException extends ApiException {

    public ExpiredPasswordResetTokenException(LocalDateTime expiry) {
        super("Password reset token expired at: " + expiry, HttpStatus.BAD_REQUEST);
    }
}