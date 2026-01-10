package com.diploma.proforientation.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when building the LLM prompt fails.
 */
public class LlmPromptException extends ApiException {

    public LlmPromptException(String message, Throwable cause) {
        super(message, HttpStatus.INTERNAL_SERVER_ERROR, cause);
    }

    public LlmPromptException(String message) {
        super(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}