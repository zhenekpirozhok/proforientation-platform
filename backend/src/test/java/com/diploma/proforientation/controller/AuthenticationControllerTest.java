package com.diploma.proforientation.controller;

import com.diploma.proforientation.dto.*;
import com.diploma.proforientation.dto.passwordreset.RequestResetPasswordDto;
import com.diploma.proforientation.dto.passwordreset.ResetPasswordDto;
import com.diploma.proforientation.model.User;
import com.diploma.proforientation.response.LoginResponse;
import com.diploma.proforientation.service.AuthenticationService;
import com.diploma.proforientation.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.security.Principal;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthenticationControllerTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationService authenticationService;

    @InjectMocks
    private AuthenticationController authenticationController;

    private User mockUser;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        mockUser = new User();
        mockUser.setEmail("test@example.com");
        mockUser.setPasswordHash("hashedPass");
    }

    @Test
    void testRegister() {
        RegisterUserDto dto = new RegisterUserDto();
        dto.setEmail("test@example.com");
        dto.setPassword("12345");

        when(authenticationService.signup(dto)).thenReturn(mockUser);

        ResponseEntity<User> response = authenticationController.register(dto);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(mockUser, response.getBody());
    }

    @Test
    void testAuthenticate() {
        LoginUserDto dto = new LoginUserDto();
        dto.setEmail("test@example.com");
        dto.setPassword("12345");
        dto.setRememberMe(false);

        when(authenticationService.authenticate(dto)).thenReturn(mockUser);
        when(jwtService.generateToken(mockUser)).thenReturn("access123");
        when(jwtService.generateRefreshToken(mockUser)).thenReturn("refresh123");
        when(jwtService.getExpirationTime()).thenReturn(3600L);

        ResponseEntity<LoginResponse> response = authenticationController.authenticate(dto);

        assertEquals(200, response.getStatusCode().value());
        assertEquals("access123", response.getBody().getToken());
        assertEquals("refresh123", response.getBody().getRefreshToken());
    }

    @Test
    void testRefreshToken_valid() {
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("refreshToken");

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(mockUser, null)
        );

        when(jwtService.isTokenValid("refreshToken", mockUser)).thenReturn(true);
        when(jwtService.generateToken(mockUser)).thenReturn("newAccess");
        when(jwtService.getExpirationTime()).thenReturn(3600L);

        ResponseEntity<LoginResponse> response = authenticationController.refreshToken(request);

        assertEquals(200, response.getStatusCode().value());
        assertEquals("newAccess", response.getBody().getToken());
        assertEquals("refreshToken", response.getBody().getRefreshToken());
    }

    @Test
    void testRefreshToken_invalid() {
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("invalid");

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(mockUser, null)
        );

        when(jwtService.isTokenValid("invalid", mockUser)).thenReturn(false);

        ResponseEntity<LoginResponse> response = authenticationController.refreshToken(request);

        assertEquals(401, response.getStatusCode().value());
    }

    @Test
    void testRequestReset() {
        RequestResetPasswordDto dto = new RequestResetPasswordDto("test@example.com");

        ResponseEntity<?> response = authenticationController.requestReset(dto);

        verify(authenticationService).sendResetToken("test@example.com");
        assertEquals(200, response.getStatusCode().value());
        assertEquals("Reset link sent if email exists", response.getBody());
    }

    @Test
    void testResetPassword() {
        ResetPasswordDto dto = new ResetPasswordDto("token123", "newPass123");

        ResponseEntity<?> response = authenticationController.resetPassword(dto);

        verify(authenticationService).resetPassword("token123", "newPass123");
        assertEquals(200, response.getStatusCode().value());
        assertEquals("Password reset successful", response.getBody());
    }

    @Test
    void testGoogleOneTap_success() {
        GoogleOneTapLoginRequest request = new GoogleOneTapLoginRequest();
        request.setToken("googleIdToken");

        when(authenticationService.authenticateWithGoogleIdToken("googleIdToken"))
                .thenReturn(mockUser);
        when(jwtService.generateToken(mockUser)).thenReturn("access123");
        when(jwtService.generateRefreshToken(mockUser)).thenReturn("refresh123");
        when(jwtService.getExpirationTime()).thenReturn(3600L);

        ResponseEntity<?> response = authenticationController.handleGoogleOneTap(request);

        assertEquals(200, response.getStatusCode().value());
        assertInstanceOf(LoginResponse.class, response.getBody());
    }

    @Test
    void testGoogleOneTap_failure() {
        GoogleOneTapLoginRequest request = new GoogleOneTapLoginRequest();
        request.setToken("invalidToken");

        when(authenticationService.authenticateWithGoogleIdToken("invalidToken"))
                .thenThrow(new RuntimeException("Invalid token"));

        ResponseEntity<?> response = authenticationController.handleGoogleOneTap(request);

        assertEquals(401, response.getStatusCode().value());
        assertEquals("Invalid token", response.getBody());
    }

    @Test
    void testDeleteAccount() {
        Principal principal = () -> "test@example.com";

        ResponseEntity<Void> response =
                authenticationController.deleteAccount("password123", principal);

        verify(authenticationService).deleteAccount("test@example.com", "password123");
        assertEquals(204, response.getStatusCode().value());
    }
}