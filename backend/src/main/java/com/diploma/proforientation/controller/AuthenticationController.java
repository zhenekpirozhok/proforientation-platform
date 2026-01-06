package com.diploma.proforientation.controller;

import com.diploma.proforientation.dto.ExceptionDto;
import com.diploma.proforientation.dto.request.GoogleOneTapLoginRequest;
import com.diploma.proforientation.dto.LoginUserDto;
import com.diploma.proforientation.dto.request.RefreshTokenRequest;
import com.diploma.proforientation.dto.RegisterUserDto;
import com.diploma.proforientation.dto.passwordreset.RequestResetPasswordDto;
import com.diploma.proforientation.dto.passwordreset.ResetPasswordDto;
import com.diploma.proforientation.model.User;
import com.diploma.proforientation.dto.response.LoginResponse;
import com.diploma.proforientation.service.AttemptService;
import com.diploma.proforientation.service.AuthenticationService;
import com.diploma.proforientation.service.JwtService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication operations")
public class AuthenticationController {
    private final JwtService jwtService;
    private final AuthenticationService authenticationService;
    private final AttemptService attemptService;

    /**
     * Registers a new user with the provided registration details.
     *
     * @param registerUserDto the DTO containing user registration data, validated
     * @return a ResponseEntity containing the registered User object on success
     */
    @PostMapping("/signup")
    @Operation(
            summary = "Register a new user",
            description = "Creates a new user account using email and password."
    )
    @ApiResponse(
            responseCode = "200",
            description = "User successfully registered",
            content = @Content(schema = @Schema(implementation = User.class))
    )
    @ApiResponse(responseCode = "400", description = "Validation error",
            content = @Content(schema = @Schema(implementation = ExceptionDto.class)))
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
    @Operation(
            summary = "Authenticate user",
            description = "Authenticates a user and returns JWT access and refresh tokens."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Authentication successful",
            content = @Content(schema = @Schema(implementation = LoginResponse.class))
    )
    @ApiResponse(responseCode = "401", description = "Invalid credentials",
            content = @Content(schema = @Schema(implementation = ExceptionDto.class)))
    public ResponseEntity<LoginResponse> authenticate(@Valid @RequestBody LoginUserDto loginUserDto){
        User user = authenticationService.authenticate(loginUserDto);

        attemptService.attachGuestAttempts(
                loginUserDto.getGuestToken(),
                user
        );

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
    @Operation(
            summary = "Refresh access token",
            description = "Generates a new access token using a valid refresh token."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Token refreshed",
            content = @Content(schema = @Schema(implementation = LoginResponse.class))
    )
    @ApiResponse(responseCode = "401", description = "Invalid or expired refresh token")
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
    @Operation(
            summary = "Request password reset",
            description = "Sends a password reset link to the user's email address if it exists."
    )
    @ApiResponse(responseCode = "200", description = "Reset link sent (if email exists)")
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
    @Operation(
            summary = "Reset password",
            description = "Resets a user's password using a valid reset token."
    )
    @ApiResponse(responseCode = "200", description = "Password reset successful")
    @ApiResponse(responseCode = "400", description = "Invalid or expired token",
            content = @Content(schema = @Schema(implementation = ExceptionDto.class)))
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordDto resetPasswordDto) {
        String token = resetPasswordDto.getToken();
        String newPassword = resetPasswordDto.getNewPassword();
        authenticationService.resetPassword(token, newPassword);
        return ResponseEntity.ok("Password reset successful");
    }

    @PostMapping("/google-onetap")
    @Operation(
            summary = "Google One Tap login",
            description = "Authenticates a user using Google One Tap ID token."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Authentication successful",
            content = @Content(schema = @Schema(implementation = LoginResponse.class))
    )
    @ApiResponse(responseCode = "401", description = "Invalid Google token")
    public ResponseEntity<?> handleGoogleOneTap(@Valid @RequestBody GoogleOneTapLoginRequest request) {
        try {
            User user = authenticationService.authenticateWithGoogleIdToken(request.getToken());

            attemptService.attachGuestAttempts(
                    request.getGuestToken(),
                    user
            );

            String accessToken = jwtService.generateToken(user);
            String refreshToken = jwtService.generateRefreshToken(user);

            return ResponseEntity.ok(new LoginResponse(accessToken, refreshToken, jwtService.getExpirationTime()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }

    @DeleteMapping("/account")
    @PreAuthorize("isAuthenticated()")
    @Operation(
            summary = "Delete user account",
            description = "Deletes the authenticated user's account after password confirmation."
    )
    @ApiResponse(responseCode = "204", description = "Account deleted")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    public ResponseEntity<Void> deleteAccount(
            @RequestParam String password,
            Principal principal) {

        authenticationService.deleteAccount(principal.getName(), password);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    @Operation(
            summary = "Logout user",
            description = "Invalidates the current JWT token by blacklisting it. " +
                    "The user must be authenticated."
    )
    @ApiResponse(responseCode = "200", description = "Successfully logged out")
    @ApiResponse(responseCode = "400", description = "Missing or invalid Authorization header")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body("Missing or invalid Authorization header");
        }

        String token = authHeader.substring(7);
        jwtService.logout(token);
        SecurityContextHolder.clearContext();

        return ResponseEntity.ok("Successfully logged out");
    }
}