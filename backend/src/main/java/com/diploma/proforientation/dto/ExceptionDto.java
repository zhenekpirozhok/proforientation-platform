package com.diploma.proforientation.dto;

import java.time.Instant;

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
public record ExceptionDto(Integer code, Instant time, Object message) {}