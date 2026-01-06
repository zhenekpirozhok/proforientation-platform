package com.diploma.proforientation.service;

import com.diploma.proforientation.dto.ProfessionDto;
import com.diploma.proforientation.dto.request.create.CreateProfessionRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ProfessionService {
    Page<ProfessionDto> getAll(Pageable pageable);
    Page<ProfessionDto> getAllLocalized(Pageable pageable);
    ProfessionDto getById(Integer id);
    ProfessionDto getByIdLocalized(Integer id);
    ProfessionDto create(CreateProfessionRequest req);
    ProfessionDto update(Integer id, CreateProfessionRequest req);
    void delete(Integer id);
}
