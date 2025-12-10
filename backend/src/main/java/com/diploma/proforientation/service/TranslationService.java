package com.diploma.proforientation.service;

import com.diploma.proforientation.dto.TranslationDto;
import com.diploma.proforientation.dto.request.create.CreateTranslationRequest;
import com.diploma.proforientation.dto.request.update.UpdateTranslationRequest;

import java.util.List;

public interface TranslationService {

    TranslationDto create(CreateTranslationRequest req);
    TranslationDto update(Integer id, UpdateTranslationRequest req);
    void delete(Integer id);
    TranslationDto getById(Integer id);
    List<TranslationDto> search(String entityType, Integer entityId, String locale);
    String translate(String entityType, Integer entityId, String field, String locale);
}
