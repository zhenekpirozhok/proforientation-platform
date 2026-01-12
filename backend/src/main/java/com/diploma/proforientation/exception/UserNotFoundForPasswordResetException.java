package com.diploma.proforientation.exception;

import org.springframework.http.HttpStatus;

import static com.diploma.proforientation.util.Constants.USER_NOT_FOUND_FOR_PASSWORD_RESET;

/**
 * Thrown when a password reset token is valid but the user no longer exists.
 */
public class UserNotFoundForPasswordResetException extends ApiException {

    public UserNotFoundForPasswordResetException(String email) {
        super(
                USER_NOT_FOUND_FOR_PASSWORD_RESET,
                HttpStatus.NOT_FOUND,
                email
        );
    }
}