package com.diploma.proforientation.service;

import com.diploma.proforientation.dto.analytics.QuizAnalyticsDetailedDto;
import com.diploma.proforientation.dto.analytics.QuizAnalyticsOverviewDto;

import java.time.LocalDate;

public interface QuizAnalyticsService {
    QuizAnalyticsOverviewDto getOverview(Integer quizId, Integer quizVersionId, LocalDate from, LocalDate to);
    QuizAnalyticsDetailedDto getDetailed(Integer quizId, Integer quizVersionId);
}
