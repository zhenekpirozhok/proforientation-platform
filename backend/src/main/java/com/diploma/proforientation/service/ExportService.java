package com.diploma.proforientation.service;

import com.diploma.proforientation.dto.QuizMetricsFilter;

public interface ExportService {
    byte[] exportAllToExcel();
    byte[] exportEntityToCsv(String entity);

    byte[] exportQuizMetricsToCsv(QuizMetricsFilter filter);
    byte[] exportQuizMetricsToExcel(QuizMetricsFilter filter);

    byte[] exportQuizAnalyticsOverviewCsv(Integer quizId, Integer quizVersionId);
    byte[] exportQuizAnalyticsDetailedCsv(Integer quizId, Integer quizVersionId);

    byte[] exportQuizAnalyticsOverviewExcel(Integer quizId, Integer quizVersionId);
    byte[] exportQuizAnalyticsDetailedExcel(Integer quizId, Integer quizVersionId);

}
