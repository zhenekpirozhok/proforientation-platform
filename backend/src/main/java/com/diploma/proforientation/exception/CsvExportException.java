package com.diploma.proforientation.exception;


import org.springframework.http.HttpStatus;

/** Thrown when CSV export fails. */
public class CsvExportException extends ApiException {
    public CsvExportException(String message, Throwable cause) {
        super(message, HttpStatus.INTERNAL_SERVER_ERROR, cause);
    }
    public CsvExportException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}