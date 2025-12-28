package com.diploma.proforientation.model.view;

public interface QuizPublicMetricsView {

    Integer getQuizId();
    String getQuizCode();
    String getQuizStatus();
    Integer getCategoryId();

    Integer getQuestionsTotal();
    Integer getAttemptsTotal();
    Integer getAttemptsSubmitted();
    Double getAvgDurationSeconds();
    Integer getEstimatedDurationSeconds();
}
