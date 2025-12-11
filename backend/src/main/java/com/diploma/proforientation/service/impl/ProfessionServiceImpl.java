package com.diploma.proforientation.service.impl;

import com.diploma.proforientation.dto.ProfessionDto;
import com.diploma.proforientation.dto.request.create.CreateProfessionRequest;
import com.diploma.proforientation.model.Profession;
import com.diploma.proforientation.model.ProfessionCategory;
import com.diploma.proforientation.repository.ProfessionCategoryRepository;
import com.diploma.proforientation.repository.ProfessionRepository;
import com.diploma.proforientation.service.ProfessionService;
import com.diploma.proforientation.util.TranslationResolver;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProfessionServiceImpl implements ProfessionService {

    private final ProfessionRepository repo;
    private final ProfessionCategoryRepository categoryRepo;
    private final TranslationResolver translationResolver;

    public List<ProfessionDto> getAll() {
        return repo.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    public List<ProfessionDto> getAllLocalized(String locale) {
        return repo.findAll().stream()
                .map(p -> toDtoLocalized(p, locale))
                .toList();
    }

    public ProfessionDto getById(Integer id) {
        return repo.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new EntityNotFoundException("Profession not found"));
    }

    @Override
    public ProfessionDto getByIdLocalized(Integer id, String locale) {
        Profession p = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Profession not found"));

        return toDtoLocalized(p, locale);
    }

    public ProfessionDto create(CreateProfessionRequest req) {
        ProfessionCategory category = categoryRepo.findById(req.categoryId())
                .orElseThrow(() -> new EntityNotFoundException("Category not found"));

        Profession p = new Profession();
        p.setCode(req.code());
        p.setTitleDefault(req.title());
        p.setDescription(req.description());
        p.setMlClassCode(req.mlClassCode());
        p.setCategory(category);

        return toDto(repo.save(p));
    }

    public ProfessionDto update(Integer id, CreateProfessionRequest req) {
        Profession p = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Profession not found"));

        ProfessionCategory category = categoryRepo.findById(req.categoryId())
                .orElseThrow(() -> new EntityNotFoundException("Category not found"));

        p.setCode(req.code());
        p.setTitleDefault(req.title());
        p.setDescription(req.description());
        p.setMlClassCode(req.mlClassCode());
        p.setCategory(category);

        return toDto(repo.save(p));
    }

    public void delete(Integer id) {
        repo.deleteById(id);
    }

    private ProfessionDto toDto(Profession p) {
        return new ProfessionDto(
                p.getId(),
                p.getCode(),
                p.getTitleDefault(),
                p.getDescription(),
                p.getMlClassCode(),
                p.getCategory().getId()
        );
    }

    private ProfessionDto toDtoLocalized(Profession p, String locale) {

        String title = translationResolver.resolve(
                "profession",
                p.getId(),
                "title",
                locale,
                p.getTitleDefault()
        );

        String description = translationResolver.resolve(
                "profession",
                p.getId(),
                "description",
                locale,
                p.getDescription()
        );

        return new ProfessionDto(
                p.getId(),
                p.getCode(),
                title,
                description,
                p.getMlClassCode(),
                p.getCategory().getId()
        );
    }
}