package com.diploma.proforientation.exception;

import org.springframework.http.HttpStatus;

public class EmailAlreadyExistsException extends ApiException {
    public EmailAlreadyExistsException(String email) {
        super("Email already exists: " + email, HttpStatus.CONFLICT);
    }
}