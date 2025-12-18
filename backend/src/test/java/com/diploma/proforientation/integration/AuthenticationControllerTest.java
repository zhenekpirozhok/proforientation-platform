package com.diploma.proforientation.integration;

import com.diploma.proforientation.config.JwtAuthenticationFilter;
import com.diploma.proforientation.controller.AuthenticationController;
import com.diploma.proforientation.dto.*;
import com.diploma.proforientation.dto.passwordreset.RequestResetPasswordDto;
import com.diploma.proforientation.dto.passwordreset.ResetPasswordDto;
import com.diploma.proforientation.dto.request.GoogleOneTapLoginRequest;
import com.diploma.proforientation.dto.request.RefreshTokenRequest;
import com.diploma.proforientation.model.User;
import com.diploma.proforientation.service.AuthenticationService;
import com.diploma.proforientation.service.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
        controllers = AuthenticationController.class,
        excludeAutoConfiguration = {
                SecurityAutoConfiguration.class,
                SecurityFilterAutoConfiguration.class,
                org.springframework.boot.autoconfigure.security.oauth2.client.servlet.OAuth2ClientWebSecurityAutoConfiguration.class,
                org.springframework.boot.autoconfigure.security.oauth2.resource.servlet.OAuth2ResourceServerAutoConfiguration.class
        },
        excludeFilters = {
                @ComponentScan.Filter(
                        type = FilterType.ASSIGNABLE_TYPE,
                        classes = JwtAuthenticationFilter.class
                )
        }
)
class AuthenticationControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    AuthenticationService authenticationService;

    @MockitoBean
    JwtService jwtService;

    @Autowired
    ObjectMapper objectMapper;

    @Test
    void registerReturnsUser() throws Exception {
        RegisterUserDto dto = new RegisterUserDto("test@mail.com", "name", "password123");

        User user = new User();
        user.setEmail("test@mail.com");

        Mockito.when(authenticationService.signup(any(RegisterUserDto.class)))
                .thenReturn(user);

        mockMvc.perform(post("/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@mail.com"));
    }

    @Test
    void registerInvalidBodyReturnsBadRequest() throws Exception {
        mockMvc.perform(post("/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void loginReturnsTokens() throws Exception {
        LoginUserDto dto = new LoginUserDto("test@mail.com", "password", false);

        User user = new User();
        Mockito.when(authenticationService.authenticate(any(LoginUserDto.class)))
                .thenReturn(user);

        Mockito.when(jwtService.generateToken(user)).thenReturn("access");
        Mockito.when(jwtService.generateRefreshToken(user)).thenReturn("refresh");
        Mockito.when(jwtService.getExpirationTime()).thenReturn(3600L);

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("access"))
                .andExpect(jsonPath("$.refreshToken").value("refresh"))
                .andExpect(jsonPath("$.expiresIn").value(3600));
    }

    @Test
    void refreshInvalidTokenReturnsUnauthorized() throws Exception {
        RefreshTokenRequest request = new RefreshTokenRequest("bad-token");

        Mockito.when(jwtService.isTokenValid(any(), any()))
                .thenReturn(false);

        mockMvc.perform(post("/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void requestPasswordResetReturnsOk() throws Exception {
        RequestResetPasswordDto dto = new RequestResetPasswordDto("test@mail.com");

        mockMvc.perform(post("/auth/request-password-reset")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Reset link sent")));
    }

    @Test
    void resetPasswordReturnsOk() throws Exception {
        ResetPasswordDto dto = new ResetPasswordDto("token", "newPassword12");

        mockMvc.perform(post("/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Password reset successful")));
    }

    @Test
    void googleOneTapSuccessReturnsTokens() throws Exception {
        GoogleOneTapLoginRequest request =
                new GoogleOneTapLoginRequest("google-token");

        User user = new User();

        Mockito.when(authenticationService.authenticateWithGoogleIdToken("google-token"))
                .thenReturn(user);

        Mockito.when(jwtService.generateToken(user)).thenReturn("access");
        Mockito.when(jwtService.generateRefreshToken(user)).thenReturn("refresh");
        Mockito.when(jwtService.getExpirationTime()).thenReturn(3600L);

        mockMvc.perform(post("/auth/google-onetap")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("access"));
    }

    @Test
    void googleOneTapFailureReturnsUnauthorized() throws Exception {
        GoogleOneTapLoginRequest request =
                new GoogleOneTapLoginRequest("bad-token");

        Mockito.when(authenticationService.authenticateWithGoogleIdToken("bad-token"))
                .thenThrow(new RuntimeException("Invalid token"));

        mockMvc.perform(post("/auth/google-onetap")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }
}