package com.diploma.proforientation.controller;

import com.diploma.proforientation.dto.ExceptionDto;
import com.diploma.proforientation.exception.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdvisorControllerTest {

    private AdvisorController advisor;

    @BeforeEach
    void setUp() {
        advisor = new AdvisorController();
    }

    @Test
    void testHandleApiException() {
        ApiException ex = new ApiException("API error", HttpStatus.I_AM_A_TEAPOT);
        ResponseEntity<ExceptionDto> response = advisor.handleApiException(ex);

        assertEquals(418, response.getStatusCode().value());
        assertEquals("API error", response.getBody().message());
    }

    @Test
    void testHandleValidationErrors() throws Exception {
        var binding = mock(org.springframework.validation.BindingResult.class);
        var error = new FieldError("object", "email", "Email invalid");
        when(binding.getFieldErrors()).thenReturn(List.of(error));

        MethodParameter methodParam =
                new MethodParameter(
                        this.getClass().getDeclaredMethod("dummyMethod", String.class),
                        0
                );

        MethodArgumentNotValidException ex =
                new MethodArgumentNotValidException(methodParam, binding);

        ResponseEntity<ExceptionDto> response = advisor.handleValidationExceptions(ex);

        assertEquals(400, response.getStatusCode().value());
        assertTrue(response.getBody().message().toString().contains("Email invalid"));
    }

    // Required helper method for MethodParameter construction
    public void dummyMethod(String email) {}

    @Test
    void testHandleUsernameNotFound() {
        UsernameNotFoundException ex = new UsernameNotFoundException("User missing");

        ResponseEntity<ExceptionDto> response = advisor.handleUsernameNotFound(ex);

        assertEquals(401, response.getStatusCode().value());
        assertEquals("User missing", response.getBody().message());
    }

    @Test
    void testHandleBadRequestIllegalArgument() {
        IllegalArgumentException ex = new IllegalArgumentException("Bad arg");

        ResponseEntity<ExceptionDto> response = advisor.handleBadRequests(ex);

        assertEquals(400, response.getStatusCode().value());
        assertEquals("Bad arg", response.getBody().message());
    }

    @Test
    void testHandleBadRequestIllegalState() {
        IllegalStateException ex = new IllegalStateException("Bad state");

        ResponseEntity<ExceptionDto> response = advisor.handleBadRequests(ex);

        assertEquals(400, response.getStatusCode().value());
        assertEquals("Bad state", response.getBody().message());
    }

    @Test
    void testHandleIOException() {
        IOException ex = new IOException("IO failure");

        ResponseEntity<ExceptionDto> response = advisor.handleIOException(ex);

        assertEquals(500, response.getStatusCode().value());
        assertEquals("IO failure", response.getBody().message());
    }

    @Test
    void testHandleEmailNotFound() {
        EmailNotFoundException ex = new EmailNotFoundException("email@x.com");

        ResponseEntity<ExceptionDto> response = advisor.handleEmailNotFound(ex);

        assertEquals(404, response.getStatusCode().value());
        assertTrue(response.getBody().message().toString().contains("email"));
    }

    @Test
    void testHandleInvalidPasswordToken() {
        InvalidPasswordResetTokenException ex = new InvalidPasswordResetTokenException();

        ResponseEntity<ExceptionDto> response = advisor.handleInvalidToken(ex);

        assertEquals(400, response.getStatusCode().value());
    }

    @Test
    void testHandleExpiredPasswordToken() {
        ExpiredPasswordResetTokenException ex =
                new ExpiredPasswordResetTokenException (LocalDateTime.now());

        ResponseEntity<ExceptionDto> response = advisor.handleExpiredToken(ex);

        assertEquals(400, response.getStatusCode().value());
    }

    @Test
    void testHandleUserNotFound() {
        UserNotFoundForPasswordResetException ex =
                new UserNotFoundForPasswordResetException("Missing user");

        ResponseEntity<ExceptionDto> response = advisor.handleUserNotFound(ex);

        assertEquals(404, response.getStatusCode().value());
        assertTrue(response.getBody().message().toString().contains("Missing user"));
    }

    @Test
    void testHandleUnexpectedException() {
        Exception ex = new Exception("Unexpected");

        ResponseEntity<ExceptionDto> response = advisor.handleUnexpected(ex);

        assertEquals(500, response.getStatusCode().value());
        assertEquals("An unexpected error occurred", response.getBody().message());
    }
}