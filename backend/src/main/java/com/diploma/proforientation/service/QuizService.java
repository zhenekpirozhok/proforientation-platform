package com.diploma.proforientation.service;

import com.diploma.proforientation.dto.QuizDto;
import com.diploma.proforientation.dto.request.create.CreateQuizRequest;
import com.diploma.proforientation.dto.request.update.UpdateQuizRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface QuizService {

    Page<QuizDto> getAll(Pageable pageable);
    Page<QuizDto> getAllLocalized(Pageable pageable);
    QuizDto getById(Integer id);
    QuizDto getByIdLocalized(Integer id);
    QuizDto getByCodeLocalized(String code);
    QuizDto create(CreateQuizRequest req, Integer authorId);
    QuizDto update(Integer id, UpdateQuizRequest req);
    void delete(Integer id);
    Page<QuizDto> getByAuthor(Integer authorId, Pageable pageable);
    Page<QuizDto> search(
            String search,
            Integer categoryId,
            Integer minDurationSec,
            Integer maxDurationSec,
            Pageable pageable
    );
}