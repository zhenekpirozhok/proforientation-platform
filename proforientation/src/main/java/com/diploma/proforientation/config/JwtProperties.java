package com.diploma.proforientation.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for JWT (JSON Web Token) settings.
 * <p>
 * These properties are bound from the application configuration file (application.properties)
 * with the prefix "security.jwt".
 * </p>
 * <ul>
 *     <li>{@code secretKey} - The secret key used to sign and verify JWT tokens.</li>
 *     <li>{@code expirationTime} - The expiration time (in milliseconds) for access tokens.</li>
 *     <li>{@code longRefreshExpirationTime} - The expiration time (in milliseconds) for long-lived refresh tokens.</li>
 * </ul>
 */
@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "security.jwt")
public class JwtProperties {

    /**
     * Secret key used for signing JWT tokens.
     */
    private String secretKey;

    /**
     * Expiration time in milliseconds for access tokens.
     */
    private long expirationTime;

    /**
     * Expiration time in milliseconds for long-lived refresh tokens.
     */
    private long longRefreshExpirationTime;
}
