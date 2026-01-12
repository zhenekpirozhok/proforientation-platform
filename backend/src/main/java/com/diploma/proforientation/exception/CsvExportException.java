package com.diploma.proforientation.exception;

import org.springframework.http.HttpStatus;

/** Thrown when CSV export fails. */
public class CsvExportException extends ApiException {

    public CsvExportException(String messageKey, Object... args) {
        super(messageKey, HttpStatus.BAD_REQUEST, args);
    }

    public CsvExportException(String messageKey, Throwable cause, Object... args) {
        super(messageKey, HttpStatus.INTERNAL_SERVER_ERROR, cause, args);
    }
}