package com.diploma.proforientation.service;

import com.diploma.proforientation.dto.QuestionDto;
import com.diploma.proforientation.dto.request.create.CreateQuestionRequest;
import com.diploma.proforientation.dto.request.update.UpdateQuestionRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface QuestionService {

    QuestionDto create(CreateQuestionRequest req);
    QuestionDto update(Integer id, UpdateQuestionRequest req);
    void delete(Integer id);
    QuestionDto updateOrder(Integer id, Integer ord);
    Page<QuestionDto> getQuestionsForCurrentVersion(
            Integer quizId,
            String locale,
            Pageable pageable
    );

    Page<QuestionDto> getQuestionsForVersion(
            Integer quizId,
            Integer versionNum,
            String locale,
            Pageable pageable
    );
}
