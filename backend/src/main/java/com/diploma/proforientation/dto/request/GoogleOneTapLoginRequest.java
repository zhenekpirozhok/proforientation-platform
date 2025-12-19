package com.diploma.proforientation.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request payload for Google One Tap authentication")
public class GoogleOneTapLoginRequest {

    @NotBlank(message = "Token must not be blank")
    @Schema(
            description = "Google ID token obtained from Google One Tap login",
            examples = "eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...",
            requiredMode = Schema.RequiredMode.REQUIRED
    )
    private String token;
}
