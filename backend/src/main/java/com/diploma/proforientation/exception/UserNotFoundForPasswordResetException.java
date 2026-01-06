package com.diploma.proforientation.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when a password reset token is valid but the user no longer exists.
 */
public class UserNotFoundForPasswordResetException extends ApiException {

    public UserNotFoundForPasswordResetException(String email) {
        super("User not found for email: " + email, HttpStatus.NOT_FOUND);
    }
}