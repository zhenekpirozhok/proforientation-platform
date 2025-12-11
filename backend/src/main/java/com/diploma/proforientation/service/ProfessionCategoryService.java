package com.diploma.proforientation.service;

import com.diploma.proforientation.dto.ProfessionCategoryDto;
import com.diploma.proforientation.dto.request.create.CreateCategoryRequest;

import java.util.List;

public interface ProfessionCategoryService {
    List<ProfessionCategoryDto> getAll();
    ProfessionCategoryDto create(CreateCategoryRequest req);
    ProfessionCategoryDto update(Integer id, CreateCategoryRequest req);
    void delete(Integer id);
}
