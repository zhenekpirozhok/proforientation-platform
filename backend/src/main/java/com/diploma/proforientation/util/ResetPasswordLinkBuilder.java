package com.diploma.proforientation.util;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ResetPasswordLinkBuilder {

    private static final String SLASH = "/";
    private static final String RESET_PASSWORD_PATH = "reset-password";
    private static final String TOKEN_QUERY = "?token=";

    @Value("${frontend.base-url}")
    private String frontendBaseUrl;

    public String build(String locale, String token) {
        return frontendBaseUrl
                + SLASH + locale
                + SLASH + RESET_PASSWORD_PATH
                + TOKEN_QUERY + token;
    }
}