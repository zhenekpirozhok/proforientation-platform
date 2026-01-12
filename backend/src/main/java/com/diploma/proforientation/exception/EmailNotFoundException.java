package com.diploma.proforientation.exception;

import org.springframework.http.HttpStatus;

import static com.diploma.proforientation.util.Constants.EMAIL_NOT_FOUND;

/**
 * Thrown when an email address does not exist in the system.
 */
public class EmailNotFoundException extends ApiException {

    public EmailNotFoundException(String email) {
        super(EMAIL_NOT_FOUND, HttpStatus.NOT_FOUND, email);
    }
}