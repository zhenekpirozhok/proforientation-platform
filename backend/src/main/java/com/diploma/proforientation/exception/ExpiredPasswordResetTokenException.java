package com.diploma.proforientation.exception;

import java.time.LocalDateTime;

public class ExpiredPasswordResetTokenException extends RuntimeException {
    public ExpiredPasswordResetTokenException(LocalDateTime expiry) {
        super("Password reset token expired at: " + expiry);
    }
}