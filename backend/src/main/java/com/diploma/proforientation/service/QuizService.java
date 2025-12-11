package com.diploma.proforientation.service;

import com.diploma.proforientation.dto.QuizDto;
import com.diploma.proforientation.dto.request.create.CreateQuizRequest;
import com.diploma.proforientation.dto.request.update.UpdateQuizRequest;

import java.util.List;

public interface QuizService {

    List<QuizDto> getAll();
    List<QuizDto> getAllLocalized(String locale);
    QuizDto getById(Integer id);
    QuizDto getByIdLocalized(Integer id, String locale);
    QuizDto create(CreateQuizRequest req);
    QuizDto update(Integer id, UpdateQuizRequest req);
    void delete(Integer id);
}