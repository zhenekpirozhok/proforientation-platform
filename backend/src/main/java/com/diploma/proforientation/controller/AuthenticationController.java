package com.diploma.proforientation.controller;

import com.diploma.proforientation.dto.request.GoogleOneTapLoginRequest;
import com.diploma.proforientation.dto.LoginUserDto;
import com.diploma.proforientation.dto.request.RefreshTokenRequest;
import com.diploma.proforientation.dto.RegisterUserDto;
import com.diploma.proforientation.dto.passwordreset.RequestResetPasswordDto;
import com.diploma.proforientation.dto.passwordreset.ResetPasswordDto;
import com.diploma.proforientation.model.User;
import com.diploma.proforientation.dto.response.LoginResponse;
import com.diploma.proforientation.service.AuthenticationService;
import com.diploma.proforientation.service.JwtService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

/**
 * REST controller for handling user authentication-related endpoints,
 * including user registration, login, token refresh, and password reset operations.
 */
@RequestMapping("/auth")
@RestController
@Validated
public class AuthenticationController {
    private final JwtService jwtService;
    private final AuthenticationService authenticationService;

    /**
     * Constructs an AuthenticationController with the required dependencies.
     *
     * @param jwtService the service responsible for JWT token operations
     * @param authenticationService the service handling authentication logic
     */
    public AuthenticationController(JwtService jwtService, AuthenticationService authenticationService) {
        this.jwtService = jwtService;
        this.authenticationService = authenticationService;
    }

    /**
     * Registers a new user with the provided registration details.
     *
     * @param registerUserDto the DTO containing user registration data, validated
     * @return a ResponseEntity containing the registered User object on success
     */
    @PostMapping("/signup")
    public ResponseEntity<User> register(@Valid @RequestBody RegisterUserDto registerUserDto) {
        User registeredUser = authenticationService.signup(registerUserDto);
        return ResponseEntity.ok(registeredUser);
    }

    /**
     * Authenticates a user with email and password, returning JWT access and refresh tokens.
     *
     * @param loginUserDto the DTO containing login credentials, validated
     * @return a ResponseEntity containing LoginResponse with JWT tokens and expiration
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> authenticate(@Valid @RequestBody LoginUserDto loginUserDto){
        User user = authenticationService.authenticate(loginUserDto);
        String accessToken = jwtService.generateToken(user);
        String refreshToken = loginUserDto.isRememberMe()
                ? jwtService.generateLongLivedRefreshToken(user)
                : jwtService.generateRefreshToken(user);
        LoginResponse loginResponse = new LoginResponse(accessToken, refreshToken, jwtService.getExpirationTime());
        return ResponseEntity.ok(loginResponse);
    }

    /**
     * Refreshes the access token using a valid refresh token.
     *
     * @param request a map containing the refresh token under the key "refreshToken"
     * @return a ResponseEntity with a new access token if the refresh token is valid,
     *         or 401 Unauthorized if invalid
     */
    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refreshToken(@RequestBody RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !(auth.getPrincipal() instanceof User user)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (!jwtService.isTokenValid(refreshToken, user)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String newAccessToken = jwtService.generateToken(user);
        return ResponseEntity.ok(new LoginResponse(newAccessToken, refreshToken, jwtService.getExpirationTime()));
    }

    /**
     * Sends a password reset token to the user's email if the email exists in the system.
     *
     * @param requestResetPasswordDto DTO containing the user's email, validated
     * @return a ResponseEntity with a success message indicating a reset link was sent
     */
    @PostMapping("/request-password-reset")
    public ResponseEntity<?> requestReset(@Valid @RequestBody RequestResetPasswordDto requestResetPasswordDto) {
        String email = requestResetPasswordDto.getEmail();
        authenticationService.sendResetToken(email);
        return ResponseEntity.ok("Reset link sent if email exists");
    }

    /**
     * Resets the user's password using a valid reset token.
     *
     * @param resetPasswordDto DTO containing the reset token and new password, validated
     * @return a ResponseEntity with a success message upon successful password reset
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordDto resetPasswordDto) {
        String token = resetPasswordDto.getToken();
        String newPassword = resetPasswordDto.getNewPassword();
        authenticationService.resetPassword(token, newPassword);
        return ResponseEntity.ok("Password reset successful");
    }

    @PostMapping("/google-onetap")
    public ResponseEntity<?> handleGoogleOneTap(@Valid @RequestBody GoogleOneTapLoginRequest request) {
        try {
            User user = authenticationService.authenticateWithGoogleIdToken(request.getToken());

            String accessToken = jwtService.generateToken(user);
            String refreshToken = jwtService.generateRefreshToken(user);

            return ResponseEntity.ok(new LoginResponse(accessToken, refreshToken, jwtService.getExpirationTime()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }

    @DeleteMapping("/account")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteAccount(
            @RequestParam String password,
            Principal principal) {

        authenticationService.deleteAccount(principal.getName(), password);
        return ResponseEntity.noContent().build();
    }
}