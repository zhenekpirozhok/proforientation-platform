package com.diploma.proforientation.service;

import com.diploma.proforientation.dto.QuizVersionDto;

import java.util.List;

public interface QuizVersionService {
    List<QuizVersionDto> getVersionsForQuiz(Integer quizId);
    QuizVersionDto getCurrentVersion(Integer quizId);
    QuizVersionDto getVersion(Integer quizId, Integer version);
    QuizVersionDto publishQuiz(Integer quizId);
    QuizVersionDto copyLatestVersion(Integer quizId);
}