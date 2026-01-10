package com.diploma.proforientation.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when parsing LLM JSON output fails.
 */
public class LlmParsingException extends ApiException {

    public LlmParsingException(String message, Throwable cause) {
        super(message, HttpStatus.INTERNAL_SERVER_ERROR, cause);
    }

    public LlmParsingException(String message) {
        super(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}