package com.diploma.proforientation.service.impl;

import com.diploma.proforientation.dto.ProfessionCategoryDto;
import com.diploma.proforientation.dto.request.create.CreateCategoryRequest;
import com.diploma.proforientation.model.ProfessionCategory;
import com.diploma.proforientation.repository.ProfessionCategoryRepository;
import com.diploma.proforientation.service.ProfessionCategoryService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProfessionCategoryServiceImpl implements ProfessionCategoryService {

    private final ProfessionCategoryRepository repo;

    public List<ProfessionCategoryDto> getAll() {
        return repo.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    public ProfessionCategoryDto create(CreateCategoryRequest req) {
        ProfessionCategory cat = new ProfessionCategory();
        cat.setCode(req.code());
        cat.setName(req.name());
        cat.setColorCode(req.colorCode());
        return toDto(repo.save(cat));
    }

    public ProfessionCategoryDto update(Integer id, CreateCategoryRequest req) {
        ProfessionCategory cat = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Category not found"));

        cat.setCode(req.code());
        cat.setName(req.name());
        cat.setColorCode(req.colorCode());

        return toDto(repo.save(cat));
    }

    public void delete(Integer id) {
        repo.deleteById(id);
    }

    private ProfessionCategoryDto toDto(ProfessionCategory cat) {
        return new ProfessionCategoryDto(
                cat.getId(),
                cat.getCode(),
                cat.getName(),
                cat.getColorCode()
        );
    }
}