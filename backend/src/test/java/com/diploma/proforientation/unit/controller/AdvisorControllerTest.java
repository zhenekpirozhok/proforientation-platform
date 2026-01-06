package com.diploma.proforientation.unit.controller;

import com.diploma.proforientation.controller.AdvisorController;
import com.diploma.proforientation.dto.ExceptionDto;
import com.diploma.proforientation.exception.*;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.security.access.AccessDeniedException;

import java.io.IOException;
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

    /**
     * Dummy method used only for constructing {@link org.springframework.core.MethodParameter}
     * instances in unit tests.
     *
     * <p>
     * This method is never executed at runtime. It exists solely to provide
     * a valid {@code Method} reference required by Spring test utilities
     * (e.g. {@link org.springframework.web.bind.MethodArgumentNotValidException}).
     * </p>
     */
    public void dummyMethod(String value) {
        // intentionally empty; used only for MethodParameter construction in tests
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
    void testHandleUnexpectedException() {
        Exception ex = new Exception("Unexpected");

        ResponseEntity<ExceptionDto> response = advisor.handleUnexpected(ex);

        assertEquals(500, response.getStatusCode().value());
        assertEquals("An unexpected error occurred", response.getBody().message());
    }


    @Test
    void testHandleBadCredentials() {
        var ex = new org.springframework.security.authentication.BadCredentialsException("Invalid credentials");

        ResponseEntity<ExceptionDto> response = advisor.handleBadCredentials(ex);

        assertEquals(401, response.getStatusCode().value());
        assertEquals("Invalid credentials", response.getBody().message());
    }

    @Test
    void testHandleAuthenticationException() {
        AuthenticationException ex = new AuthenticationServiceException("Auth failed");

        ResponseEntity<ExceptionDto> response = advisor.handleAuthentication(ex);

        assertEquals(401, response.getStatusCode().value());
        assertEquals("Unauthorized", response.getBody().message());
    }

    @Test
    void testHandleAuthorizationDenied() {
        var ex = mock(org.springframework.security.authorization.AuthorizationDeniedException.class);
        when(ex.getMessage()).thenReturn("Denied by policy");

        ResponseEntity<ExceptionDto> response = advisor.handleAuthorizationDenied(ex);

        assertEquals(403, response.getStatusCode().value());
        assertEquals("Access denied: insufficient permissions", response.getBody().message());
    }

    @Test
    void testHandleAccessDenied() {
        AccessDeniedException ex = new AccessDeniedException("Forbidden");

        ResponseEntity<ExceptionDto> response = advisor.handleAccessDenied(ex);

        assertEquals(403, response.getStatusCode().value());
        assertEquals("Access denied", response.getBody().message());
    }

    @Test
    void testHandleEntityNotFoundException() {
        EntityNotFoundException ex = new EntityNotFoundException("Entity missing");

        ResponseEntity<ExceptionDto> response = advisor.handleEntityNotFound(ex);

        assertEquals(404, response.getStatusCode().value());
        assertEquals("Entity missing", response.getBody().message());
    }

    @Test
    void testHandleNoHandlerFound() {
        NoHandlerFoundException ex = new NoHandlerFoundException("GET", "/missing", null);

        ResponseEntity<ExceptionDto> response = advisor.handleNoHandlerFound(ex);

        assertEquals(404, response.getStatusCode().value());
        assertEquals("Endpoint not found", response.getBody().message());
    }

    @Test
    void testHandleMethodNotSupported() {
        HttpRequestMethodNotSupportedException ex =
                new HttpRequestMethodNotSupportedException(
                        "PUT",
                        List.of("GET", "POST")
                );

        ResponseEntity<ExceptionDto> response = advisor.handleMethodNotSupported(ex);

        assertEquals(405, response.getStatusCode().value());
        assertTrue(response.getBody().message().toString().contains("PUT"));
    }

    @Test
    void testHandleDataIntegrityViolation() {
        DataIntegrityViolationException ex = new DataIntegrityViolationException(
                "Constraint violation",
                new RuntimeException("unique constraint uq_user_email")
        );

        ResponseEntity<ExceptionDto> response = advisor.handleDataIntegrity(ex);

        assertEquals(409, response.getStatusCode().value());
        assertEquals("Data integrity violation", response.getBody().message());
    }

    @Test
    void testHandleNotReadable() {
        HttpMessageNotReadableException ex =
                mock(HttpMessageNotReadableException.class);

        when(ex.getMessage()).thenReturn("Malformed JSON");

        ResponseEntity<ExceptionDto> response = advisor.handleNotReadable(ex);

        assertEquals(400, response.getStatusCode().value());
        assertEquals("Malformed JSON request", response.getBody().message());
    }

    @Test
    void testHandleMissingServletRequestParameter() {
        MissingServletRequestParameterException ex =
                new MissingServletRequestParameterException("page", "int");

        ResponseEntity<ExceptionDto> response = advisor.handleMissingParam(ex);

        assertEquals(400, response.getStatusCode().value());
        assertTrue(response.getBody().message().toString().contains("page"));
    }

    @Test
    void testHandleMissingRequestHeader() {
        MissingRequestHeaderException ex = new MissingRequestHeaderException("Authorization", dummyMethodParameter());

        ResponseEntity<ExceptionDto> response = advisor.handleMissingHeader(ex);

        assertEquals(400, response.getStatusCode().value());
        assertTrue(response.getBody().message().toString().contains("Authorization"));
    }

    @Test
    void testHandleMissingServletRequestPart() {
        MissingServletRequestPartException ex = new MissingServletRequestPartException("file");

        ResponseEntity<ExceptionDto> response = advisor.handleMissingPart(ex);

        assertEquals(400, response.getStatusCode().value());
        assertTrue(response.getBody().message().toString().contains("file"));
    }

    @Test
    void testHandleTypeMismatch() {
        MethodArgumentTypeMismatchException ex = mock(MethodArgumentTypeMismatchException.class);
        when(ex.getName()).thenReturn("id");
        when(ex.getValue()).thenReturn("abc");

        ResponseEntity<ExceptionDto> response = advisor.handleTypeMismatch(ex);

        assertEquals(400, response.getStatusCode().value());
        assertTrue(response.getBody().message().toString().contains("id"));
        assertTrue(response.getBody().message().toString().contains("abc"));
    }

    /**
     * Creates a MethodParameter for MissingRequestHeaderException constructor.
     * Reuses the existing dummyMethod in this test class.
     */
    private MethodParameter dummyMethodParameter() {
        try {
            return new MethodParameter(
                    this.getClass().getDeclaredMethod("dummyMethod", String.class),
                    0
            );
        } catch (NoSuchMethodException e) {
            throw new RuntimeException(e);
        }
    }
}