package com.diploma.proforientation.unit.util;

import com.diploma.proforientation.util.ResetPasswordLinkBuilder;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;

class ResetPasswordLinkBuilderTest {

    @Test
    void buildResetPasswordLink_withLocale() {
        ResetPasswordLinkBuilder b = new ResetPasswordLinkBuilder();
        ReflectionTestUtils.setField(b, "frontendBaseUrl", "http://localhost:3000");

        String link = b.build("en", "abc123");

        assertThat(link)
                .isEqualTo("http://localhost:3000/en/reset-password?token=abc123");
    }
}
