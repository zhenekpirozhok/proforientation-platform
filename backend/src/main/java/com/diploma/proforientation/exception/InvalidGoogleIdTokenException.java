package com.diploma.proforientation.exception;


import org.springframework.http.HttpStatus;

/**
 * Thrown when Google ID token is invalid or cannot be verified.
 */
public class InvalidGoogleIdTokenException extends ApiException {
    public InvalidGoogleIdTokenException() {
        super("Invalid Google ID token", HttpStatus.UNAUTHORIZED);
    }
}