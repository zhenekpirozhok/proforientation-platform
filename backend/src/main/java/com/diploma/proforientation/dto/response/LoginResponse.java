package com.diploma.proforientation.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * Represents the response returned after a successful login or token refresh operation.
 *
 * <p>Contains the JWT access token, refresh token, and the access token expiration time.</p>
 */
@Getter
@Setter
@Schema(description = "Response returned after successful authentication or token refresh")
public class LoginResponse {

    /**
     * The JWT access token used for authenticating requests.
     */
    @Schema(
            description = "JWT access token used to authorize API requests",
            example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    )
    private String token;

    /**
     * The refresh token used to obtain new access tokens.
     */
    @Schema(
            description = "Refresh token used to obtain a new access token",
            example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    )
    private String refreshToken;

    /**
     * The expiration time of the access token in seconds.
     */
    @Schema(
            description = "Access token expiration time in seconds",
            example = "3600"
    )
    private long expiresIn;

    /**
     * Constructs a new {@code LoginResponse} with the specified tokens and expiration.
     *
     * @param token the JWT access token
     * @param refreshToken the refresh token
     * @param expiresIn the expiration time of the access token in seconds
     */
    public LoginResponse(String token, String refreshToken, long expiresIn) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.expiresIn = expiresIn;
    }
}
