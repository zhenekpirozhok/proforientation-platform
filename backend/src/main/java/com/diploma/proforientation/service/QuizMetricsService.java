package com.diploma.proforientation.service;

import com.diploma.proforientation.dto.QuizMetricsFilter;
import com.diploma.proforientation.dto.QuizPublicMetricsDto;

import java.util.List;

public interface QuizMetricsService {
    List<QuizPublicMetricsDto> getAllPublicMetrics();
    QuizPublicMetricsDto getMetricsForQuiz(Integer quizId);
    List<QuizPublicMetricsDto> getPublicMetrics(QuizMetricsFilter filter);
}
