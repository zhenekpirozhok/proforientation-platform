package com.diploma.proforientation.service;

import com.diploma.proforientation.dto.QuizVersionDto;

public interface QuizVersionService {

    QuizVersionDto publishQuiz(Integer quizId);
    QuizVersionDto copyLatestVersion(Integer quizId);
}