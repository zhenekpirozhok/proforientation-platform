package com.diploma.proforientation.service;

import com.diploma.proforientation.dto.ProfessionDto;
import com.diploma.proforientation.dto.request.create.CreateProfessionRequest;
import com.diploma.proforientation.model.Profession;
import com.diploma.proforientation.model.ProfessionCategory;
import com.diploma.proforientation.repository.ProfessionCategoryRepository;
import com.diploma.proforientation.repository.ProfessionRepository;
import com.diploma.proforientation.service.impl.ProfessionServiceImpl;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.any;

@ExtendWith(MockitoExtension.class)
class ProfessionServiceTest {

    @Mock
    private ProfessionRepository professionRepo;

    @Mock
    private ProfessionCategoryRepository categoryRepo;

    @InjectMocks
    private ProfessionServiceImpl service;

    @Test
    void getAll_shouldReturnListOfDtos() {
        ProfessionCategory cat = new ProfessionCategory();
        cat.setId(1);
        cat.setCode("IT");
        cat.setName("Tech");
        cat.setColorCode("#000");

        Profession p1 = new Profession();
        p1.setId(10);
        p1.setCode("DEV");
        p1.setTitleDefault("Developer");
        p1.setDescription("Writes code");
        p1.setCategory(cat);

        Profession p2 = new Profession();
        p2.setId(11);
        p2.setCode("DS");
        p2.setTitleDefault("Data Scientist");
        p2.setDescription("Analyzes data");
        p2.setCategory(cat);

        when(professionRepo.findAll()).thenReturn(List.of(p1, p2));

        List<ProfessionDto> result = service.getAll();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).code()).isEqualTo("DEV");
        assertThat(result.get(1).title()).isEqualTo("Data Scientist");

        verify(professionRepo).findAll();
    }

    @Test
    void getById_shouldReturnDto_whenProfessionExists() {

        ProfessionCategory cat = new ProfessionCategory();
        cat.setId(1);

        Profession p = new Profession();
        p.setId(10);
        p.setCode("DEV");
        p.setTitleDefault("Developer");
        p.setCategory(cat);

        when(professionRepo.findById(10)).thenReturn(Optional.of(p));

        ProfessionDto result = service.getById(10);

        assertThat(result.id()).isEqualTo(10);
        assertThat(result.code()).isEqualTo("DEV");

        verify(professionRepo).findById(10);
    }

    @Test
    void getById_shouldThrow_whenNotFound() {
        when(professionRepo.findById(777)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getById(777))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Profession not found");

        verify(professionRepo).findById(777);
    }

    @Test
    void create_shouldSaveNewProfession() {

        CreateProfessionRequest req = new CreateProfessionRequest(
                "DEV", "Developer", "Writes code", "ML123", 1
        );

        ProfessionCategory cat = new ProfessionCategory();
        cat.setId(1);
        cat.setCode("IT");
        cat.setName("Tech");
        cat.setColorCode("#111111");

        when(categoryRepo.findById(1)).thenReturn(Optional.of(cat));

        Profession saved = new Profession();
        saved.setId(100);
        saved.setCode("DEV");
        saved.setTitleDefault("Developer");
        saved.setDescription("Writes code");
        saved.setMlClassCode("ML123");
        saved.setCategory(cat);

        when(professionRepo.save(any())).thenReturn(saved);

        ProfessionDto result = service.create(req);

        assertThat(result.id()).isEqualTo(100);
        assertThat(result.code()).isEqualTo("DEV");
        assertThat(result.categoryId()).isEqualTo(1);

        verify(categoryRepo).findById(1);
        verify(professionRepo).save(any(Profession.class));
    }

    @Test
    void create_shouldThrow_whenCategoryNotFound() {

        CreateProfessionRequest req = new CreateProfessionRequest(
                "DEV", "Developer", "Writes code", "ML123", 99
        );

        when(categoryRepo.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(req))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Category not found");

        verify(categoryRepo).findById(99);
        verify(professionRepo, never()).save(any());
    }

    @Test
    void update_shouldModifyExistingProfession() {

        CreateProfessionRequest req = new CreateProfessionRequest(
                "DEV2", "New Title", "New Description", "ML456", 1
        );

        ProfessionCategory cat = new ProfessionCategory();
        cat.setId(1);

        Profession existing = new Profession();
        existing.setId(20);
        existing.setCode("DEV");
        existing.setTitleDefault("Old Title");
        existing.setCategory(cat);

        when(professionRepo.findById(20)).thenReturn(Optional.of(existing));
        when(categoryRepo.findById(1)).thenReturn(Optional.of(cat));
        when(professionRepo.save(existing)).thenReturn(existing);

        ProfessionDto result = service.update(20, req);

        assertThat(result.code()).isEqualTo("DEV2");
        assertThat(result.title()).isEqualTo("New Title");
        assertThat(result.categoryId()).isEqualTo(1);

        verify(professionRepo).findById(20);
        verify(categoryRepo).findById(1);
        verify(professionRepo).save(existing);
    }

    @Test
    void update_shouldThrow_whenProfessionNotFound() {

        CreateProfessionRequest req = new CreateProfessionRequest(
                "DEV", "Developer", "Writes code", "ML123", 1
        );

        when(professionRepo.findById(55)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(55, req))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Profession not found");

        verify(professionRepo).findById(55);
        verify(categoryRepo, never()).findById(any());
        verify(professionRepo, never()).save(any());
    }

    @Test
    void update_shouldThrow_whenCategoryNotFound() {

        CreateProfessionRequest req = new CreateProfessionRequest(
                "DEV", "Developer", "Writes code", "ML123", 99
        );

        Profession existing = new Profession();
        existing.setId(30);

        when(professionRepo.findById(30)).thenReturn(Optional.of(existing));
        when(categoryRepo.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(30, req))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Category not found");

        verify(categoryRepo).findById(99);
        verify(professionRepo, never()).save(any());
    }

    @Test
    void delete_shouldCallRepositoryDelete() {
        service.delete(7);
        verify(professionRepo).deleteById(7);
    }
}
