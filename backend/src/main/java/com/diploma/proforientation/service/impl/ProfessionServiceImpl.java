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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProfessionServiceImpl implements ProfessionService {

    private static final String ENTITY_TYPE_PROF = "profession";
    public static final String FIELD_TITLE = "title";
    public static final String FIELD_DESCRIPTION = "description";
    public static final String NO_PROFESSION_MESSAGE = "Profession not found";
    public static final String NO_CATEGORY_MESSAGE = "Category not found";

    private final ProfessionRepository repo;
    private final ProfessionCategoryRepository categoryRepo;
    private final TranslationResolver translationResolver;

    @Override
    public Page<ProfessionDto> getAll(Pageable pageable) {
        return repo.findAll(pageable)
                .map(this::toDto);
    }

    @Override
    public Page<ProfessionDto> getAllLocalized(String locale, Pageable pageable) {
        return repo.findAll(pageable)
                .map(p -> toDtoLocalized(p, locale));
    }

    public ProfessionDto getById(Integer id) {
        return repo.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new EntityNotFoundException(NO_PROFESSION_MESSAGE));
    }

    @Override
    public ProfessionDto getByIdLocalized(Integer id, String locale) {
        Profession p = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(NO_PROFESSION_MESSAGE));

        return toDtoLocalized(p, locale);
    }

    @Transactional
    public ProfessionDto create(CreateProfessionRequest req) {
        ProfessionCategory category = categoryRepo.findById(req.categoryId())
                .orElseThrow(() -> new EntityNotFoundException(NO_CATEGORY_MESSAGE));

        Profession p = new Profession();
        p.setCode(req.code());
        p.setTitleDefault(req.title());
        p.setDescription(req.description());
        p.setMlClassCode(req.mlClassCode());
        p.setCategory(category);

        return toDto(repo.save(p));
    }

    @Transactional
    public ProfessionDto update(Integer id, CreateProfessionRequest req) {
        Profession p = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(NO_PROFESSION_MESSAGE));

        ProfessionCategory category = categoryRepo.findById(req.categoryId())
                .orElseThrow(() -> new EntityNotFoundException(NO_CATEGORY_MESSAGE));

        p.setCode(req.code());
        p.setTitleDefault(req.title());
        p.setDescription(req.description());
        p.setMlClassCode(req.mlClassCode());
        p.setCategory(category);

        return toDto(repo.save(p));
    }

    @Transactional
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
                ENTITY_TYPE_PROF,
                p.getId(),
                FIELD_TITLE,
                locale,
                p.getTitleDefault()
        );

        String description = translationResolver.resolve(
                ENTITY_TYPE_PROF,
                p.getId(),
                FIELD_DESCRIPTION,
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