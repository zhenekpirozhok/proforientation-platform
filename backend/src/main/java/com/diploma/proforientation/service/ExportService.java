package com.diploma.proforientation.service;

public interface ExportService {
    byte[] exportAllToExcel();
    byte[] exportEntityToCsv(String entity);
}
