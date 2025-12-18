package com.diploma.proforientation.unit.service;

import com.diploma.proforientation.dto.ProfessionDto;
import com.diploma.proforientation.dto.request.create.CreateProfessionRequest;
import com.diploma.proforientation.model.Profession;
import com.diploma.proforientation.model.ProfessionCategory;
import com.diploma.proforientation.repository.ProfessionCategoryRepository;
import com.diploma.proforientation.repository.ProfessionRepository;
import com.diploma.proforientation.service.impl.ProfessionServiceImpl;
import com.diploma.proforientation.util.TranslationResolver;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ProfessionServiceTest {

    @Mock
    private ProfessionRepository repo;

    @Mock
    private ProfessionCategoryRepository categoryRepo;

    @Mock
    private TranslationResolver translationResolver;

    @InjectMocks
    private ProfessionServiceImpl service;

    private Profession profession;
    private ProfessionCategory category;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        category = new ProfessionCategory();
        category.setId(10);

        profession = new Profession();
        profession.setId(1);
        profession.setCode("DEV");
        profession.setTitleDefault("Developer");
        profession.setDescription("Writes code");
        profession.setMlClassCode("ML_DEV");
        profession.setCategory(category);
    }

    @Test
    void shouldReturnAllProfessionsWithPagination() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Profession> page = new PageImpl<>(List.of(profession), pageable, 1);

        when(repo.findAll(pageable)).thenReturn(page);

        Page<ProfessionDto> result = service.getAll(pageable);

        assertEquals(1, result.getContent().size());
        assertEquals("Developer", result.getContent().getFirst().title());

        verify(repo).findAll(pageable);
    }

    @Test
    void shouldReturnLocalizedProfessions() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Profession> page = new PageImpl<>(List.of(profession), pageable, 1);

        when(repo.findAll(pageable)).thenReturn(page);
        when(translationResolver.resolve(any(), any(), eq("title"), eq("en"), any()))
                .thenReturn("Developer EN");
        when(translationResolver.resolve(any(), any(), eq("description"), eq("en"), any()))
                .thenReturn("Writes code EN");

        Page<ProfessionDto> result = service.getAllLocalized("en", pageable);

        ProfessionDto dto = result.getContent().getFirst();
        assertEquals("Developer EN", dto.title());
        assertEquals("Writes code EN", dto.description());

        verify(translationResolver, times(2))
                .resolve(any(), any(), any(), eq("en"), any());
    }

    @Test
    void shouldReturnProfessionById() {
        when(repo.findById(1)).thenReturn(Optional.of(profession));

        ProfessionDto dto = service.getById(1);

        assertEquals("Developer", dto.title());
        verify(repo).findById(1);
    }

    @Test
    void shouldThrowWhenProfessionNotFound() {
        when(repo.findById(99)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class,
                () -> service.getById(99));
    }

    @Test
    void shouldReturnLocalizedProfessionById() {
        when(repo.findById(1)).thenReturn(Optional.of(profession));
        when(translationResolver.resolve(any(), any(), eq("title"), eq("en"), any()))
                .thenReturn("Developer EN");
        when(translationResolver.resolve(any(), any(), eq("description"), eq("en"), any()))
                .thenReturn("Writes code EN");

        ProfessionDto dto = service.getByIdLocalized(1, "en");

        assertEquals("Developer EN", dto.title());
        assertEquals("Writes code EN", dto.description());
    }

    @Test
    void shouldCreateProfession() {
        CreateProfessionRequest req = new CreateProfessionRequest(
                "DEV",
                "Developer",
                "Writes code",
                "ML_DEV",
                10
        );

        when(categoryRepo.findById(10)).thenReturn(Optional.of(category));
        when(repo.save(any(Profession.class))).thenAnswer(inv -> inv.getArgument(0));

        ProfessionDto dto = service.create(req);

        assertEquals("Developer", dto.title());
        assertEquals(10, dto.categoryId());

        verify(repo).save(any(Profession.class));
    }

    @Test
    void shouldThrowWhenCategoryNotFoundOnCreate() {
        CreateProfessionRequest req = new CreateProfessionRequest(
                "DEV", "Developer", "Writes code", "ML_DEV", 99
        );

        when(categoryRepo.findById(99)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class,
                () -> service.create(req));
    }

    @Test
    void shouldUpdateProfession() {
        CreateProfessionRequest req = new CreateProfessionRequest(
                "DEV2",
                "Senior Dev",
                "Writes better code",
                "ML_DEV2",
                10
        );

        when(repo.findById(1)).thenReturn(Optional.of(profession));
        when(categoryRepo.findById(10)).thenReturn(Optional.of(category));
        when(repo.save(any(Profession.class))).thenAnswer(inv -> inv.getArgument(0));

        ProfessionDto dto = service.update(1, req);

        assertEquals("Senior Dev", dto.title());
        assertEquals("ML_DEV2", dto.mlClassCode());
    }

    @Test
    void shouldThrowWhenProfessionNotFoundOnUpdate() {
        CreateProfessionRequest req = new CreateProfessionRequest(
                "DEV", "Dev", "Desc", "ML", 10
        );

        when(repo.findById(1)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class,
                () -> service.update(1, req));
    }

    @Test
    void shouldDeleteProfession() {
        doNothing().when(repo).deleteById(1);

        service.delete(1);

        verify(repo).deleteById(1);
    }
}