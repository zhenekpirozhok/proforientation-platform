package com.diploma.proforientation.service;

import com.diploma.proforientation.dto.QuestionDto;
import com.diploma.proforientation.dto.request.create.CreateQuestionRequest;
import com.diploma.proforientation.dto.request.update.UpdateQuestionRequest;

import java.util.List;

public interface QuestionService {

    QuestionDto create(CreateQuestionRequest req);
    QuestionDto update(Integer id, UpdateQuestionRequest req);
    void delete(Integer id);
    QuestionDto updateOrder(Integer id, Integer ord);
    List<QuestionDto> getQuestionsForCurrentVersion(Integer quizId, String locale);
    List<QuestionDto> getQuestionsForVersion(Integer quizId, Integer version, String locale);
}
