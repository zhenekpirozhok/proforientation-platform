package com.diploma.proforientation.unit.controller;

import com.diploma.proforientation.controller.AdvisorController;
import com.diploma.proforientation.dto.ExceptionDto;
import com.diploma.proforientation.exception.ApiException;
import com.diploma.proforientation.util.I18n;
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

import static com.diploma.proforientation.util.Constants.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdvisorControllerTest {

    private AdvisorController advisor;
    private I18n i18n;

    @BeforeEach
    void setUp() {
        i18n = mock(I18n.class);
        advisor = new AdvisorController(i18n);
    }

    @Test
    void testHandleApiException_Localized() {
        ApiException ex = mock(ApiException.class);
        when(ex.getStatus()).thenReturn(HttpStatus.I_AM_A_TEAPOT);
        when(ex.getMessageKey()).thenReturn("error.some_key");
        when(ex.getArgs()).thenReturn(new Object[]{"x"});

        when(i18n.msg("error.some_key", "x")).thenReturn("Localized API error");

        ResponseEntity<ExceptionDto> response = advisor.handleApiException(ex);

        assertEquals(418, response.getStatusCode().value());
        assertEquals("Localized API error", response.getBody().message());
    }

    @Test
    void testHandleValidationErrors_UsesDefaultMessage_WhenNotKey() throws Exception {
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
        verifyNoInteractions(i18n); // because "Email invalid" doesn't start with "error."
    }

    public void dummyMethod(String value) {
        // only for MethodParameter construction
    }

    @Test
    void testHandleBadRequestIllegalArgument_PlainMessage() {
        IllegalArgumentException ex = new IllegalArgumentException("Bad arg");

        ResponseEntity<ExceptionDto> response = advisor.handleBadRequests(ex);

        assertEquals(400, response.getStatusCode().value());
        assertEquals("Bad arg", response.getBody().message());
        verifyNoInteractions(i18n);
    }

    @Test
    void testHandleBadRequestIllegalState_KeyMessageLocalized() {
        IllegalStateException ex = new IllegalStateException("error.some_state");

        when(i18n.msg("error.some_state")).thenReturn("Localized state error");

        ResponseEntity<ExceptionDto> response = advisor.handleBadRequests(ex);

        assertEquals(400, response.getStatusCode().value());
        assertEquals("Localized state error", response.getBody().message());
        verify(i18n).msg("error.some_state");
    }

    @Test
    void testHandleIOException_UsesLocalizedKey() {
        IOException ex = new IOException("IO failure");

        when(i18n.msg(ERROR_IO)).thenReturn("Localized IO error");

        ResponseEntity<ExceptionDto> response = advisor.handleIOException(ex);

        assertEquals(500, response.getStatusCode().value());
        assertEquals("Localized IO error", response.getBody().message());
        verify(i18n).msg(ERROR_IO);
    }

    @Test
    void testHandleUnexpectedException_UsesLocalizedKey() {
        Exception ex = new Exception("Unexpected");

        when(i18n.msg(ERROR_UNEXPECTED)).thenReturn("Localized unexpected error");

        ResponseEntity<ExceptionDto> response = advisor.handleUnexpected(ex);

        assertEquals(500, response.getStatusCode().value());
        assertEquals("Localized unexpected error", response.getBody().message());
        verify(i18n).msg(ERROR_UNEXPECTED);
    }

    @Test
    void testHandleBadCredentials_UsesLocalizedKey() {
        var ex = new org.springframework.security.authentication.BadCredentialsException("Invalid credentials");

        when(i18n.msg(INVALID_CREDENTIALS)).thenReturn("Localized invalid credentials");

        ResponseEntity<ExceptionDto> response = advisor.handleBadCredentials(ex);

        assertEquals(401, response.getStatusCode().value());
        assertEquals("Localized invalid credentials", response.getBody().message());
        verify(i18n).msg(INVALID_CREDENTIALS);
    }

    @Test
    void testHandleAuthenticationException_UsesLocalizedKey() {
        AuthenticationException ex = new AuthenticationServiceException("Auth failed");

        when(i18n.msg(ERROR_UNAUTHORIZED)).thenReturn("Localized unauthorized");

        ResponseEntity<ExceptionDto> response = advisor.handleAuthentication(ex);

        assertEquals(401, response.getStatusCode().value());
        assertEquals("Localized unauthorized", response.getBody().message());
        verify(i18n).msg(ERROR_UNAUTHORIZED);
    }

    @Test
    void testHandleAuthorizationDenied_UsesLocalizedKey() {
        var ex = mock(org.springframework.security.authorization.AuthorizationDeniedException.class);
        when(ex.getMessage()).thenReturn("Denied by policy");

        when(i18n.msg(ERROR_ACCESS_DENIED)).thenReturn("Localized access denied");

        ResponseEntity<ExceptionDto> response = advisor.handleAuthorizationDenied(ex);

        assertEquals(403, response.getStatusCode().value());
        assertEquals("Localized access denied", response.getBody().message());
        verify(i18n).msg(ERROR_ACCESS_DENIED);
    }

    @Test
    void testHandleAccessDenied_UsesLocalizedKey() {
        AccessDeniedException ex = new AccessDeniedException("Forbidden");

        when(i18n.msg(ERROR_ACCESS_DENIED)).thenReturn("Localized access denied");

        ResponseEntity<ExceptionDto> response = advisor.handleAccessDenied(ex);

        assertEquals(403, response.getStatusCode().value());
        assertEquals("Localized access denied", response.getBody().message());
        verify(i18n).msg(ERROR_ACCESS_DENIED);
    }

    @Test
    void testHandleEntityNotFoundException_UsesLocalizedKey() {
        EntityNotFoundException ex = new EntityNotFoundException("Entity missing");

        when(i18n.msg(ERROR_ENTITY_NOT_FOUND)).thenReturn("Localized entity not found");

        ResponseEntity<ExceptionDto> response = advisor.handleEntityNotFound(ex);

        assertEquals(404, response.getStatusCode().value());
        assertEquals("Localized entity not found", response.getBody().message());
        verify(i18n).msg(ERROR_ENTITY_NOT_FOUND);
    }

    @Test
    void testHandleNoHandlerFound_UsesLocalizedKey() {
        NoHandlerFoundException ex = new NoHandlerFoundException("GET", "/missing", null);

        when(i18n.msg(ERROR_ENDPOINT_NOT_FOUND)).thenReturn("Localized endpoint not found");

        ResponseEntity<ExceptionDto> response = advisor.handleNoHandlerFound(ex);

        assertEquals(404, response.getStatusCode().value());
        assertEquals("Localized endpoint not found", response.getBody().message());
        verify(i18n).msg(ERROR_ENDPOINT_NOT_FOUND);
    }

    @Test
    void testHandleMethodNotSupported_UsesLocalizedKey() {
        HttpRequestMethodNotSupportedException ex =
                new HttpRequestMethodNotSupportedException("PUT", List.of("GET", "POST"));

        when(i18n.msg(ERROR_METHOD_NOT_ALLOWED)).thenReturn("Localized method not allowed");

        ResponseEntity<ExceptionDto> response = advisor.handleMethodNotSupported(ex);

        assertEquals(405, response.getStatusCode().value());
        assertEquals("Localized method not allowed", response.getBody().message());
        verify(i18n).msg(ERROR_METHOD_NOT_ALLOWED);
    }

    @Test
    void testHandleDataIntegrityViolation_UsesLocalizedKey() {
        DataIntegrityViolationException ex = new DataIntegrityViolationException(
                "Constraint violation",
                new RuntimeException("unique constraint uq_user_email")
        );

        when(i18n.msg(ERROR_DATA_INTEGRITY)).thenReturn("Localized data integrity violation");

        ResponseEntity<ExceptionDto> response = advisor.handleDataIntegrity(ex);

        assertEquals(409, response.getStatusCode().value());
        assertEquals("Localized data integrity violation", response.getBody().message());
        verify(i18n).msg(ERROR_DATA_INTEGRITY);
    }

    @Test
    void testHandleNotReadable_UsesLocalizedKey() {
        HttpMessageNotReadableException ex = mock(HttpMessageNotReadableException.class);
        when(ex.getMessage()).thenReturn("Malformed JSON");

        when(i18n.msg(ERROR_MALFORMED_JSON)).thenReturn("Localized malformed json");

        ResponseEntity<ExceptionDto> response = advisor.handleNotReadable(ex);

        assertEquals(400, response.getStatusCode().value());
        assertEquals("Localized malformed json", response.getBody().message());
        verify(i18n).msg(ERROR_MALFORMED_JSON);
    }

    @Test
    void testHandleMissingServletRequestParameter_UsesArgs() throws Exception {
        MissingServletRequestParameterException ex =
                new MissingServletRequestParameterException("page", "int");

        when(i18n.msg(ERROR_MISSING_PARAMETER, "page")).thenReturn("Localized missing param: page");

        ResponseEntity<ExceptionDto> response = advisor.handleMissingParam(ex);

        assertEquals(400, response.getStatusCode().value());
        assertEquals("Localized missing param: page", response.getBody().message());
        verify(i18n).msg(ERROR_MISSING_PARAMETER, "page");
    }

    @Test
    void testHandleMissingRequestHeader_UsesArgs() {
        MissingRequestHeaderException ex =
                new MissingRequestHeaderException("Authorization", dummyMethodParameter());

        when(i18n.msg(ERROR_MISSING_HEADER, "Authorization")).thenReturn("Localized missing header: Authorization");

        ResponseEntity<ExceptionDto> response = advisor.handleMissingHeader(ex);

        assertEquals(400, response.getStatusCode().value());
        assertEquals("Localized missing header: Authorization", response.getBody().message());
        verify(i18n).msg(ERROR_MISSING_HEADER, "Authorization");
    }

    @Test
    void testHandleMissingServletRequestPart_UsesArgs() {
        MissingServletRequestPartException ex = new MissingServletRequestPartException("file");

        when(i18n.msg(ERROR_MISSING_MULTIPART_PART, "file")).thenReturn("Localized missing part: file");

        ResponseEntity<ExceptionDto> response = advisor.handleMissingPart(ex);

        assertEquals(400, response.getStatusCode().value());
        assertEquals("Localized missing part: file", response.getBody().message());
        verify(i18n).msg(ERROR_MISSING_MULTIPART_PART, "file");
    }

    @Test
    void testHandleTypeMismatch_UsesArgs() {
        MethodArgumentTypeMismatchException ex = mock(MethodArgumentTypeMismatchException.class);
        when(ex.getName()).thenReturn("id");
        when(ex.getValue()).thenReturn("abc");

        when(i18n.msg(ERROR_INVALID_PARAMETER_VALUE, "id", "abc"))
                .thenReturn("Localized invalid value for id: abc");

        ResponseEntity<ExceptionDto> response = advisor.handleTypeMismatch(ex);

        assertEquals(400, response.getStatusCode().value());
        assertEquals("Localized invalid value for id: abc", response.getBody().message());
        verify(i18n).msg(ERROR_INVALID_PARAMETER_VALUE, "id", "abc");
    }

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