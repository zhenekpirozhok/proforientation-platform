package com.diploma.proforientation.service;

import com.diploma.proforientation.dto.TraitDto;
import com.diploma.proforientation.dto.request.create.CreateTraitRequest;

import java.util.List;

public interface TraitService {
    List<TraitDto> getAll();
    List<TraitDto> getAllLocalized();
    TraitDto getById(Integer id);
    TraitDto getByIdLocalized(Integer id);
    TraitDto create(CreateTraitRequest req);
    TraitDto update(Integer id, CreateTraitRequest req);
    void delete(Integer id);
}
