package com.diploma.proforientation.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when building the LLM prompt fails.
 */
public class LlmPromptException extends ApiException {

    public LlmPromptException(String messageKey, Throwable cause, Object... args) {
        super(
                messageKey,
                HttpStatus.INTERNAL_SERVER_ERROR,
                cause,
                args
        );
    }
}