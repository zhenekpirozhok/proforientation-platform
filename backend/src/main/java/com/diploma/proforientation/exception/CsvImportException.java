package com.diploma.proforientation.exception;

import org.springframework.http.HttpStatus;

import static com.diploma.proforientation.util.Constants.CSV_IMPORT_FAILED;

/**
 * Thrown when a CSV import cannot be processed due to file/format/parsing issues.
 */
public class CsvImportException extends ApiException {

    public CsvImportException() {
        super(CSV_IMPORT_FAILED, HttpStatus.BAD_REQUEST);
    }

    public CsvImportException(Throwable cause) {
        super(CSV_IMPORT_FAILED, HttpStatus.BAD_REQUEST, cause);
    }
}