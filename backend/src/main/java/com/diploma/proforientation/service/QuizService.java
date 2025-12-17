package com.diploma.proforientation.service;

import com.diploma.proforientation.dto.QuizDto;
import com.diploma.proforientation.dto.request.create.CreateQuizRequest;
import com.diploma.proforientation.dto.request.update.UpdateQuizRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface QuizService {

    Page<QuizDto> getAll(Pageable pageable);
    Page<QuizDto> getAllLocalized(String locale, Pageable pageable);
    QuizDto getById(Integer id);
    QuizDto getByIdLocalized(Integer id, String locale);
    QuizDto create(CreateQuizRequest req);
    QuizDto update(Integer id, UpdateQuizRequest req);
    void delete(Integer id);
}