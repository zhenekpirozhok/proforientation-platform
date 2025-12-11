package com.diploma.proforientation.dto.response;

import lombok.Getter;
import lombok.Setter;

/**
 * Represents the response returned after a successful login or token refresh operation.
 *
 * <p>Contains the JWT access token, refresh token, and the access token expiration time.</p>
 */
@Getter
@Setter
public class LoginResponse {

    /**
     * The JWT access token used for authenticating requests.
     */
    private String token;

    /**
     * The refresh token used to obtain new access tokens.
     */
    private String refreshToken;

    /**
     * The expiration time of the access token in milliseconds.
     */
    private long expiresIn;

    /**
     * Constructs a new {@code LoginResponse} with the specified tokens and expiration.
     *
     * @param token the JWT access token
     * @param refreshToken the refresh token
     * @param expiresIn the expiration time of the access token in milliseconds
     */
    public LoginResponse(String token, String refreshToken, long expiresIn) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.expiresIn = expiresIn;
    }
}
