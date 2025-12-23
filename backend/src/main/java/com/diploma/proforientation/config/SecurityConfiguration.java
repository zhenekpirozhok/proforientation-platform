package com.diploma.proforientation.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfiguration {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfiguration(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(withDefaults())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth

                // --- public (no auth) ---
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/actuator/health/readiness").permitAll()
                .requestMatchers("/error").permitAll()
                .requestMatchers("/api/v1.0/**").permitAll()
                .requestMatchers("/demo/**").permitAll()
                .requestMatchers("/reset-password", "/reset-password/**").permitAll()

                // public read-only reference data
                .requestMatchers(HttpMethod.GET, "/quizzes", "/quizzes/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/questions", "/questions/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/options", "/options/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/professions", "/professions/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/traits", "/traits/**").permitAll() // ✅ was missing

                // public attempts write-flow (guest mode)
                .requestMatchers(HttpMethod.POST, "/attempts", "/attempts/**").permitAll()
                .requestMatchers(HttpMethod.PUT,  "/attempts", "/attempts/**").permitAll()
                .requestMatchers(HttpMethod.PATCH,"/attempts", "/attempts/**").permitAll()

                // --- protected ---
                // reading attempts/results requires auth (JWT)
                .requestMatchers(HttpMethod.GET, "/attempts", "/attempts/**").authenticated()

                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(List.of(
            "http://localhost:3000",
            "http://localhost:8082",
            "http://localhost:5173"
        ));

        configuration.setAllowedMethods(List.of(
            "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"
        ));

        configuration.setAllowedHeaders(List.of(
            "Authorization",
            "Content-Type",
            "X-XSRF-TOKEN",
            "Accept",
            "Accept-Language",
            "X-Locale"
        ));

        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
