package com.diploma.proforientation.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when a CSV import cannot be processed due to file/format/parsing issues.
 */
public class CsvImportException extends ApiException {

    public CsvImportException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }

    public CsvImportException(String message, Throwable cause) {
        super(message, HttpStatus.BAD_REQUEST, cause);
    }
}