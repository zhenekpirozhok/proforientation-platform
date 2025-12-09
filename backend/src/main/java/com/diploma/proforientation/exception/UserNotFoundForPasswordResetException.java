package com.diploma.proforientation.exception;

public class UserNotFoundForPasswordResetException extends RuntimeException {
    public UserNotFoundForPasswordResetException(String email) {
        super("User not found for email: " + email);
    }
}