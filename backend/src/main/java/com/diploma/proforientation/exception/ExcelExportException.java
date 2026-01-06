package com.diploma.proforientation.exception;

import org.springframework.http.HttpStatus;

/** Thrown when Excel export fails. */
public class ExcelExportException extends ApiException {
    public ExcelExportException(String message, Throwable cause) {
        super(message, HttpStatus.INTERNAL_SERVER_ERROR, cause);
    }
}