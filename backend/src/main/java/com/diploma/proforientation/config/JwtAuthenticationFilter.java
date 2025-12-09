package com.diploma.proforientation.config;

import com.diploma.proforientation.service.impl.JwtServiceImpl;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerExceptionResolver;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.lang.NonNull;

import java.io.IOException;
import java.util.List;

/**
 * A Spring Security filter that intercepts HTTP requests to validate JWT tokens.
 * <p>
 * This filter extracts the JWT token from the Authorization header,
 * validates it, and if valid, sets the authenticated user in the SecurityContext.
 * <p>
 * Any exceptions during token processing are handled by the configured {@link HandlerExceptionResolver}.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final HandlerExceptionResolver handlerExceptionResolver;
    private final JwtServiceImpl jwtServiceImpl;
    private final UserDetailsService userDetailsService;

    /**
     * Constructs a new {@code JwtAuthenticationFilter}.
     *
     * @param handlerExceptionResolver used to handle exceptions during filtering
     * @param jwtServiceImpl               service for JWT operations like extraction and validation
     * @param userDetailsService       service to load user details by username/email
     */
    public JwtAuthenticationFilter(
            HandlerExceptionResolver handlerExceptionResolver,
            JwtServiceImpl jwtServiceImpl,
            UserDetailsService userDetailsService) {
        this.handlerExceptionResolver = handlerExceptionResolver;
        this.jwtServiceImpl = jwtServiceImpl;
        this.userDetailsService = userDetailsService;
    }

    /**
     * Filters incoming HTTP requests and performs JWT validation.
     * <p>
     * - Extracts the JWT token from the "Authorization" header.
     * - Validates the token and retrieves the associated user.
     * - If valid, creates an authentication token and sets it in the security context.
     * - In case of exceptions, delegates handling to the {@link HandlerExceptionResolver}.
     *
     * @param request  the incoming HTTP request
     * @param response the HTTP response
     * @param chain    the filter chain to pass the request/response to the next filter
     * @throws ServletException in case of a servlet error
     * @throws IOException      in case of I/O error during filtering
     */
    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain chain) throws ServletException, IOException {
        final String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        try {
            final String jwt = authHeader.substring(7);
            final String userEmail = jwtServiceImpl.extractUsername(jwt);

            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (userEmail != null && authentication == null) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);

                if (jwtServiceImpl.isTokenValid(jwt, userDetails)) {
                    Claims claims = jwtServiceImpl.extractAllClaims(jwt);
                    List<String> roles = claims.get("roles", List.class);
                    var authorities = roles.stream()
                            .map(SimpleGrantedAuthority::new)
                            .toList();

                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    authorities
                            );

                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
            chain.doFilter(request, response);
        } catch (Exception e) {
            handlerExceptionResolver.resolveException(request, response, null, e);
        }
    }
}
