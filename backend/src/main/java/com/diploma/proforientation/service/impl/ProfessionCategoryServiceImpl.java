package com.diploma.proforientation.service.impl;

import com.diploma.proforientation.dto.ProfessionCategoryDto;
import com.diploma.proforientation.dto.request.create.CreateCategoryRequest;
import com.diploma.proforientation.model.ProfessionCategory;
import com.diploma.proforientation.repository.ProfessionCategoryRepository;
import com.diploma.proforientation.service.ProfessionCategoryService;
import com.diploma.proforientation.util.LocaleProvider;
import com.diploma.proforientation.util.TranslationResolver;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static com.diploma.proforientation.util.Constants.*;

@Service
@RequiredArgsConstructor
public class ProfessionCategoryServiceImpl implements ProfessionCategoryService {

    private final ProfessionCategoryRepository repo;
    private final TranslationResolver translationResolver;
    private final LocaleProvider localeProvider;

    public List<ProfessionCategoryDto> getAll() {
        return repo.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    public List<ProfessionCategoryDto> getAllLocalized() {
        String locale = localeProvider.currentLanguage();

        return repo.findAll().stream()
                .map(cat -> toDtoLocalized(cat, locale))
                .toList();
    }

    @Transactional
    public ProfessionCategoryDto create(CreateCategoryRequest req) {
        ProfessionCategory cat = new ProfessionCategory();
        cat.setCode(req.code());
        cat.setName(req.name());
        cat.setColorCode(req.colorCode());
        return toDto(repo.save(cat));
    }

    @Transactional
    public ProfessionCategoryDto update(Integer id, CreateCategoryRequest req) {
        ProfessionCategory cat = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(CATEGORY_NOT_FOUND));

        cat.setCode(req.code());
        cat.setName(req.name());
        cat.setColorCode(req.colorCode());

        return toDto(repo.save(cat));
    }

    @Transactional
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

    private ProfessionCategoryDto toDtoLocalized(ProfessionCategory cat, String locale) {
        String name = translationResolver.resolve(
                ENTITY_TYPE_CATEGORY,
                cat.getId(),
                FIELD_TITLE,
                locale,
                cat.getName()
        );

        return new ProfessionCategoryDto(
                cat.getId(),
                cat.getCode(),
                name,
                cat.getColorCode()
        );
    }
}