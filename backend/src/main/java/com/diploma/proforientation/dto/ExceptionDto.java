package com.diploma.proforientation.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.Map;

/**
 * A standardized structure for API error responses.
 *
 * <p>This DTO is used for all exceptions handled by the global exception handler.
 * The {@code message} field may contain a simple string or a structured object
 * (e.g., a map of validation errors).</p>
 *
 * @param code    the HTTP status code of the error
 * @param time    the timestamp when the error occurred
 * @param message a human-readable message or structured error details
 */
@Schema(description = "Standardized API error response returned for all handled exceptions")
public record ExceptionDto(
        @Schema(
                description = "HTTP status code representing the error type",
                examples = "400"
        )
        Integer code,
        @Schema(
                description = "Timestamp indicating when the error occurred (ISO-8601 format)",
                examples = "2025-01-15T14:32:10Z"
        )
        Instant time,
        @Schema(
                description = """
                        Error details. May be:
                        - a string message (e.g. 'Invalid credentials')
                        - a structured object containing validation errors
                        """,
                oneOf = {
                        String.class,
                        Map.class
                },
                examples = "Invalid email or password"
        )
        Object message) {}