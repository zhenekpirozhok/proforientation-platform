package com.diploma.proforientation.exception;

import org.springframework.http.HttpStatus;

import static com.diploma.proforientation.util.Constants.EMAIL_ALREADY_EXISTS;

public class EmailAlreadyExistsException extends ApiException {

    public EmailAlreadyExistsException(String email) {
        super(EMAIL_ALREADY_EXISTS, HttpStatus.CONFLICT, email);
    }
}