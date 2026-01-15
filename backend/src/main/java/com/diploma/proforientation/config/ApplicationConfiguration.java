package com.diploma.proforientation.config;

import com.diploma.proforientation.repository.UserRepository;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.ReloadableResourceBundleMessageSource;
import org.springframework.core.Ordered;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import static com.diploma.proforientation.util.Constants.USER_NOT_FOUND;

/**
 * Application-level security configuration.
 *
 * <p>
 * This class defines core components used by Spring Security:
 * </p>
 *
 * <ul>
 *     <li>{@link UserDetailsService} – loads users from the database.</li>
 *     <li>{@link PasswordEncoder} – encodes and verifies passwords (BCrypt).</li>
 *     <li>{@link AuthenticationManager} – the central authentication entry point.</li>
 * </ul>
 *
 * <p>
 * <b>Note:</b> In modern Spring Security (6.3+) it is no longer necessary to manually define
 * a {@code DaoAuthenticationProvider}. Spring automatically creates the appropriate provider
 * using the registered {@link UserDetailsService} and {@link PasswordEncoder}.
 * </p>
 */
@Configuration
public class ApplicationConfiguration {
    private static final String MESSAGE_BASENAME = "classpath:messages";
    private static final String MESSAGE_ENCODING = "UTF-8";
    private static final boolean FALLBACK_TO_SYSTEM_LOCALE = false;

    private final UserRepository userRepository;

    /**
     * Constructs an instance of the configuration using the provided {@link UserRepository}.
     *
     * @param userRepository a repository used to load user information
     */
    public ApplicationConfiguration(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Defines the {@link UserDetailsService} bean, responsible for loading users by email.
     *
     * <p>
     * Spring Security internally uses this bean when building authentication providers.
     * </p>
     *
     * @return a UserDetailsService that fetches users from the database
     */
    @Bean
    public UserDetailsService userDetailsService() {
        return email -> userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(USER_NOT_FOUND));
    }

    /**
     * Defines the {@link PasswordEncoder} bean using BCrypt hashing.
     *
     * <p>
     * BCrypt provides secure hashing with built-in salting.
     * </p>
     *
     * @return a BCrypt password encoder
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Exposes the {@link AuthenticationManager} bean.
     *
     * <p>
     * Spring Security automatically wires:
     * </p>
     * <ul>
     *     <li>The {@link UserDetailsService}</li>
     *     <li>The {@link PasswordEncoder}</li>
     * </ul>
     *
     * <p>
     * and internally builds a {@code DaoAuthenticationProvider} without requiring explicit configuration.
     * </p>
     *
     * @param config Spring's authentication configuration
     * @return the application's AuthenticationManager
     * @throws Exception if authentication manager creation fails
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * MessageSource configuration for application i18n.
     *
     * <p>
     * Uses {@code messages.properties} as the base bundle with UTF-8 encoding and
     * disables fallback to the system locale to ensure predictable localization
     * and prevent message keys from being returned when a locale-specific bundle
     * is missing.
     * </p>
     */
    @Bean
    public MessageSource messageSource() {
        ReloadableResourceBundleMessageSource messageSource = new ReloadableResourceBundleMessageSource();
        messageSource.setBasename(MESSAGE_BASENAME);
        messageSource.setDefaultEncoding(MESSAGE_ENCODING);
        messageSource.setFallbackToSystemLocale(FALLBACK_TO_SYSTEM_LOCALE);
        return messageSource;
    }

    /**
     * Registers the {@link GlobalRateLimitFilter} as a servlet filter with the highest precedence.
     * <p>
     * This filter is applied early in the filter chain to enforce global rate limiting
     * before other filters or request processing logic are executed.
     *
     * @param filter the {@link GlobalRateLimitFilter} to be registered
     * @return a {@link FilterRegistrationBean} configured with the highest precedence
     */
    @Bean
    public FilterRegistrationBean<GlobalRateLimitFilter> rateLimitFilter(GlobalRateLimitFilter filter) {
        FilterRegistrationBean<GlobalRateLimitFilter> bean = new FilterRegistrationBean<>();
        bean.setFilter(filter);
        bean.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return bean;
    }
}