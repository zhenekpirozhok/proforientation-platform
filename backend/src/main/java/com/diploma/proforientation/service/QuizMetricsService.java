package com.diploma.proforientation.service;

import com.diploma.proforientation.model.view.QuizPublicMetricsView;

import java.util.List;

public interface QuizMetricsService {
    List<QuizPublicMetricsView> getAllPublicMetrics();
    QuizPublicMetricsView getMetricsForQuiz(Integer quizId);
}
