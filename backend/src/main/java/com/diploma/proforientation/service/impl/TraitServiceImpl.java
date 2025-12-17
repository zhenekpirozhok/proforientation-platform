package com.diploma.proforientation.service.impl;

import com.diploma.proforientation.dto.TraitDto;
import com.diploma.proforientation.dto.request.create.CreateTraitRequest;
import com.diploma.proforientation.model.TraitProfile;
import com.diploma.proforientation.repository.TraitProfileRepository;
import com.diploma.proforientation.service.TraitService;
import com.diploma.proforientation.util.TranslationResolver;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static com.diploma.proforientation.service.impl.ProfessionServiceImpl.FIELD_DESCRIPTION;


@Service
@RequiredArgsConstructor
public class TraitServiceImpl implements TraitService {

    private static final String ENTITY_TYPE_TRAIT= "trait";
    private static final String FIELD_NAME = "name";

    private final TraitProfileRepository repo;
    private final TranslationResolver translationResolver;

    @Override
    public List<TraitDto> getAll() {
        return repo.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    public List<TraitDto> getAllLocalized(String locale) {
        return repo.findAll().stream()
                .map(t -> toDtoLocalized(t, locale))
                .toList();
    }

    @Override
    public TraitDto getById(Integer id) {
        return repo.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new EntityNotFoundException("Trait not found"));
    }

    @Override
    public TraitDto getByIdLocalized(Integer id, String locale) {
        TraitProfile trait = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Trait not found"));

        return toDtoLocalized(trait, locale);
    }

    @Override
    @Transactional
    public TraitDto create(CreateTraitRequest req) {
        TraitProfile t = new TraitProfile();
        t.setCode(req.code());
        t.setName(req.name());
        t.setDescription(req.description());
        t.setBipolarPairCode(req.bipolarPairCode());
        return toDto(repo.save(t));
    }

    @Override
    @Transactional
    public TraitDto update(Integer id, CreateTraitRequest req) {
        TraitProfile t = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Trait not found"));

        t.setCode(req.code());
        t.setName(req.name());
        t.setDescription(req.description());
        t.setBipolarPairCode(req.bipolarPairCode());

        return toDto(repo.save(t));
    }

    @Override
    @Transactional
    public void delete(Integer id) {
        repo.deleteById(id);
    }

    private TraitDto toDto(TraitProfile t) {
        return new TraitDto(
                t.getId(),
                t.getCode(),
                t.getName(),
                t.getDescription(),
                t.getBipolarPairCode()
        );
    }

    private TraitDto toDtoLocalized(TraitProfile trait, String locale) {

        String name = translationResolver.resolve(
                ENTITY_TYPE_TRAIT,
                trait.getId(),
                FIELD_NAME,
                locale,
                trait.getName()
        );

        String description = translationResolver.resolve(
                ENTITY_TYPE_TRAIT,
                trait.getId(),
                FIELD_DESCRIPTION,
                locale,
                trait.getDescription()
        );

        return new TraitDto(
                trait.getId(),
                trait.getCode(),
                name,
                description,
                trait.getBipolarPairCode()
        );
    }
}