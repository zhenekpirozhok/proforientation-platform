package com.diploma.proforientation.config;


import com.diploma.proforientation.service.JwtService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import com.diploma.proforientation.repository.UserRepository;
import com.diploma.proforientation.service.OAuth2UserService;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

import static org.springframework.security.config.Customizer.withDefaults;

/**
 * Security configuration for the application.
 * <p>
 * This class configures Spring Security for the application, including:
 * </p>
 * <ul>
 *   <li>Disabling CSRF protection for APIs.</li>
 *   <li>Defining public endpoints that don't require authentication.</li>
 *   <li>Setting session management to stateless for JWT-based authentication.</li>
 *   <li>Configuring authentication provider and JWT filter.</li>
 *   <li>Configuring OAuth2 login and user handling.</li>
 *   <li>Setting up CORS policy for the frontend client.</li>
 * </ul>
 */
@Configuration
@EnableWebSecurity
public class SecurityConfiguration {
    private final AuthenticationProvider authenticationProvider;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final OAuth2UserService OAuth2UserService;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    /**
     * Constructor for SecurityConfiguration.
     *
     * @param authenticationProvider the authentication provider bean
     * @param jwtAuthenticationFilter the JWT authentication filter bean
     * @param oAuth2UserService the OAuth2 user service bean
     * @param jwtService the JWT service bean
     * @param userRepository the user repository bean
     */
    public SecurityConfiguration(AuthenticationProvider authenticationProvider,
                                 JwtAuthenticationFilter jwtAuthenticationFilter,
                                 OAuth2UserService oAuth2UserService,
                                 JwtService jwtService, UserRepository userRepository) {
        this.authenticationProvider = authenticationProvider;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        OAuth2UserService = oAuth2UserService;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    /**
     * Configures the security filter chain.
     *
     * @param http the HttpSecurity to modify
     * @return the configured SecurityFilterChain
     * @throws Exception if an error occurs during configuration
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                .cors(withDefaults())
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(
                                "/auth/**",
                                "/api/v1.0/**",
                                "/actuator/health/readiness",
                                "/error",
                                "/reset-password**"
                        ).permitAll()
                        .anyRequest().authenticated())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    /**
     * Configures CORS to allow requests from the frontend.
     *
     * @return a CorsConfigurationSource with allowed origins, methods, and headers set
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:8080", "http://localhost:5173"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-XSRF-TOKEN", "Accept"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
