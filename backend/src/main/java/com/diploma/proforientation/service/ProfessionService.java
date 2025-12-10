package com.diploma.proforientation.service;

import com.diploma.proforientation.dto.ProfessionDto;
import com.diploma.proforientation.dto.request.create.CreateProfessionRequest;

import java.util.List;

public interface ProfessionService {
    List<ProfessionDto> getAll();
    List<ProfessionDto> getAllLocalized(String locale);
    ProfessionDto getById(Integer id);
    ProfessionDto getByIdLocalized(Integer id, String locale);
    ProfessionDto create(CreateProfessionRequest req);
    ProfessionDto update(Integer id, CreateProfessionRequest req);
    void delete(Integer id);
}
