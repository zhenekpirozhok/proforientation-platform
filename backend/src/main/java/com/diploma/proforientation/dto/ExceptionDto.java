package com.diploma.proforientation.dto;

import java.time.Instant;

/**
 * A Data Transfer Object (DTO) representing details of an exception or error response.
 * <p>
 * This record is used to standardize the structure of error messages returned to the client.
 * </p>
 *
 * @param code    the HTTP status code associated with the exception
 * @param time    the timestamp indicating when the exception occurred
 * @param message a human-readable message describing the error
 */
public record ExceptionDto(Integer code, Instant time, String message) {}
