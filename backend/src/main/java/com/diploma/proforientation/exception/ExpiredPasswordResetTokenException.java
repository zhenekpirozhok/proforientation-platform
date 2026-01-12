package com.diploma.proforientation.exception;

import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;

import static com.diploma.proforientation.util.Constants.PASSWORD_RESET_TOKEN_EXPIRED;

/**
 * Thrown when a password reset token has expired.
 */
public class ExpiredPasswordResetTokenException extends ApiException {

    public ExpiredPasswordResetTokenException(LocalDateTime expiry) {
        super(
                PASSWORD_RESET_TOKEN_EXPIRED,
                HttpStatus.BAD_REQUEST,
                expiry
        );
    }
}