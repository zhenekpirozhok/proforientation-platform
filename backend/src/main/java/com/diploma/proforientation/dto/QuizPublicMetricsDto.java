package com.diploma.proforientation.dto;

import com.diploma.proforientation.model.view.QuizPublicMetricsEntity;

import java.math.BigDecimal;

public record QuizPublicMetricsDto(
        Integer quizId,
        String quizCode,
        String quizStatus,
        Integer categoryId,
        Integer questionsTotal,
        Integer attemptsTotal,
        Integer attemptsSubmitted,
        BigDecimal avgDurationSeconds,
        Integer estimatedDurationSeconds
) {
    public static QuizPublicMetricsDto from(QuizPublicMetricsEntity e) {
        return new QuizPublicMetricsDto(
                e.getQuizId(),
                e.getQuizCode(),
                e.getQuizStatus(),
                e.getCategoryId(),
                e.getQuestionsTotal(),
                e.getAttemptsTotal(),
                e.getAttemptsSubmitted(),
                e.getAvgDurationSeconds(),
                e.getEstimatedDurationSeconds()
        );
    }
}