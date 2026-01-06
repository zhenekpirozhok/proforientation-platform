package com.diploma.proforientation.util;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ResetPasswordLinkBuilder {

    @Value("${frontend.base-url}")
    private String frontendBaseUrl;

    public String build(String locale, String token) {
        return frontendBaseUrl
                + "/" + locale
                + "/reset-password?token="
                + token;
    }
}