package com.diploma.proforientation.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration class for Swagger/OpenAPI documentation.
 * <p>
 * This class sets up the OpenAPI specification with a security scheme
 * that uses HTTP Bearer tokens (JWT) for authentication.
 * </p>
 */
@Configuration
public class SwaggerConfiguration {

    /**
     * Creates a security scheme for HTTP Bearer authentication using JWT tokens.
     *
     * @return a configured SecurityScheme instance representing HTTP Bearer JWT authentication.
     */
    private SecurityScheme createAPIKeyScheme() {
        return new SecurityScheme().type(SecurityScheme.Type.HTTP)
                .bearerFormat("JWT")
                .scheme("bearer");
    }

    /**
     * Configures the OpenAPI bean with security requirements and security schemes.
     * <p>
     * Adds a security requirement named "Bearer Authentication" that uses the
     * HTTP Bearer scheme defined in {@link #createAPIKeyScheme()}.
     * </p>
     *
     * @return the configured OpenAPI instance.
     */
    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI().addSecurityItem(new SecurityRequirement().
                        addList("Bearer Authentication"))
                .components(new Components().addSecuritySchemes
                        ("Bearer Authentication", createAPIKeyScheme()));
    }
}
