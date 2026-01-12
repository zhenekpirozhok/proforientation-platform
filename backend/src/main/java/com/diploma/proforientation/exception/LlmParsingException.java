package com.diploma.proforientation.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when parsing LLM JSON output fails.
 */
public class LlmParsingException extends ApiException {

    public LlmParsingException(String messageKey, Throwable cause, Object... args) {
        super(
                messageKey,
                HttpStatus.INTERNAL_SERVER_ERROR,
                cause,
                args
        );
    }
}