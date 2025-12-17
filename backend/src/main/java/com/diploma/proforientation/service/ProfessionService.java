package com.diploma.proforientation.service;

import com.diploma.proforientation.dto.ProfessionDto;
import com.diploma.proforientation.dto.request.create.CreateProfessionRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ProfessionService {
    Page<ProfessionDto> getAll(Pageable pageable);
    Page<ProfessionDto> getAllLocalized(String locale, Pageable pageable);
    ProfessionDto getById(Integer id);
    ProfessionDto getByIdLocalized(Integer id, String locale);
    ProfessionDto create(CreateProfessionRequest req);
    ProfessionDto update(Integer id, CreateProfessionRequest req);
    void delete(Integer id);
}
