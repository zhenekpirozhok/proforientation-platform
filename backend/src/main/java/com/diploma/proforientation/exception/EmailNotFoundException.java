package com.diploma.proforientation.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when an email address does not exist in the system.
 */
public class EmailNotFoundException extends ApiException {
    public EmailNotFoundException(String email) {
        super("Email not found: " + email, HttpStatus.NOT_FOUND);
    }
}