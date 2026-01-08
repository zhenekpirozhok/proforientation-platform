package com.diploma.proforientation.service;

import com.diploma.proforientation.dto.AttemptResultDto;
import com.diploma.proforientation.dto.AttemptSummaryDto;
import com.diploma.proforientation.dto.response.AttemptStartResponse;
import com.diploma.proforientation.model.User;

import java.time.Instant;
import java.util.List;

public interface AttemptService {

    AttemptStartResponse startAttempt(Integer quizVersionId, Integer userId);
    void addAnswer(Integer attemptId, Integer optionId);
    void addAnswersBulk(Integer attemptId, List<Integer> optionIds);
    AttemptResultDto submitAttempt(Integer attemptId);
    List<AttemptSummaryDto> getMyAttempts(Integer userId, String guestToken);
    AttemptResultDto getResult(Integer attemptId);
    List<AttemptSummaryDto> adminSearchAttempts(Integer userId, Integer quizId, Instant from, Instant to);
    void attachGuestAttempts(String guestToken, User user);
    void addAnswersForQuestion(Integer attemptId, Integer questionId, List<Integer> optionIds);
    void deleteSelectedAttempts(Integer userId, String guestToken, List<Integer> attemptIds, boolean confirm);
}