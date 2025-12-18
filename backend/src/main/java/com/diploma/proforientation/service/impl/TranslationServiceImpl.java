package com.diploma.proforientation.service.impl;

import com.diploma.proforientation.dto.TranslationDto;
import com.diploma.proforientation.dto.request.create.CreateTranslationRequest;
import com.diploma.proforientation.dto.request.update.UpdateTranslationRequest;
import com.diploma.proforientation.model.Translation;
import com.diploma.proforientation.repository.TranslationRepository;
import com.diploma.proforientation.service.TranslationService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static com.diploma.proforientation.util.ErrorMessages.TRANSLATION_NOT_FOUND;

@Service
@RequiredArgsConstructor
public class TranslationServiceImpl implements TranslationService {

    private static final String CACHE_VALUE = "translations";

    private final TranslationRepository repo;

    @Override
    @CacheEvict(
            value = CACHE_VALUE,
            key = "T(String).format('%s:%d:%s:%s', #req.entityType(), #req.entityId(), #req.field(), #req.locale())"
    )
    @Transactional
    public TranslationDto create(CreateTranslationRequest req) {
        Translation t = new Translation();
        t.setEntityType(req.entityType());
        t.setEntityId(req.entityId());
        t.setField(req.field());
        t.setLocale(req.locale());
        t.setText(req.text());

        return toDto(repo.save(t));
    }

    @Override
    @CacheEvict(value = CACHE_VALUE, allEntries = true)
    @Transactional
    public TranslationDto update(Integer id, UpdateTranslationRequest req) {
        Translation t = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(TRANSLATION_NOT_FOUND));

        t.setText(req.text());
        return toDto(repo.save(t));
    }

    @Override
    @CacheEvict(value = CACHE_VALUE, allEntries = true)
    @Transactional
    public void delete(Integer id) {
        if (!repo.existsById(id)) {
            throw new EntityNotFoundException(TRANSLATION_NOT_FOUND);
        }
        repo.deleteById(id);
    }

    @Override
    public TranslationDto getById(Integer id) {
        return repo.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new EntityNotFoundException(TRANSLATION_NOT_FOUND));
    }

    @Override
    public List<TranslationDto> search(String entityType, Integer entityId, String locale) {
        return repo.findByEntityTypeAndEntityIdAndLocale(entityType, entityId, locale)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    public List<TranslationDto> getAllForEntityType(String entityType) {
        return repo
                .findByEntityType(entityType)
                .stream()
                .map(this::toDto)
                .toList();
    }

    /**
     * Generic runtime translation resolver.
     * Returns translated text or null if translation not found.
     */
    @Override
    @Cacheable(
            value = CACHE_VALUE, unless = "#result == null",
            key = "T(String).format('%s:%d:%s:%s', #entityType, #entityId, #field, #locale)"
    )
    public String translate(String entityType, Integer entityId, String field, String locale) {
        return repo.findByEntityTypeAndEntityIdAndFieldAndLocale(entityType, entityId, field, locale)
                .map(Translation::getText)
                .orElse(null);
    }

    private TranslationDto toDto(Translation t) {
        return new TranslationDto(
                t.getId(),
                t.getEntityType(),
                t.getEntityId(),
                t.getField(),
                t.getLocale(),
                t.getText()
        );
    }
}