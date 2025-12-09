package com.diploma.proforientation.service;

public interface EmailService {
    void sendResetPasswordEmail(String toEmail, String token);
}