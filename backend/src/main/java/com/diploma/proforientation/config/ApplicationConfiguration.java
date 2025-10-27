package com.diploma.proforientation.config;

import com.diploma.proforientation.repository.UserRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Configuration class for setting up Spring Security components.
 * <p>
 * Defines beans for {@link UserDetailsService}, {@link PasswordEncoder},
 * {@link AuthenticationManager}, and {@link AuthenticationProvider}.
 * </p>
 */
@Configuration
public class ApplicationConfiguration {
    private final UserRepository userRepository;

    /**
     * Constructs an instance with the given {@link UserRepository}.
     *
     * @param userRepository repository to load user details from database
     */
    public ApplicationConfiguration(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Creates a {@link UserDetailsService} bean that loads users by their email.
     *
     * @return the user details service
     */
    @Bean
    UserDetailsService userDetailsService() {
        return username -> userRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    /**
     * Creates a {@link PasswordEncoder} bean using BCrypt hashing algorithm.
     *
     * @return the password encoder
     */
    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Provides the {@link AuthenticationManager} bean from the provided
     * {@link AuthenticationConfiguration}.
     *
     * @param config the authentication configuration
     * @return the authentication manager
     * @throws Exception if unable to get the authentication manager
     */
    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * Creates an {@link AuthenticationProvider} bean configured with
     * {@link DaoAuthenticationProvider} using the user details service and password encoder.
     *
     * @return the authentication provider
     */
    @Bean
    AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService());
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }
}
