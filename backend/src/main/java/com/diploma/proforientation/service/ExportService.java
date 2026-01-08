package com.diploma.proforientation.service;

import com.diploma.proforientation.dto.QuizMetricsFilter;

public interface ExportService {
    byte[] exportAllToExcel();
    byte[] exportEntityToCsv(String entity);

    byte[] exportQuizMetricsToCsv(QuizMetricsFilter filter);
    byte[] exportQuizMetricsToExcel(QuizMetricsFilter filter);
}
