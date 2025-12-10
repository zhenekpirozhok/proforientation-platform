package com.diploma.proforientation.service;

import com.diploma.proforientation.dto.ProfessionCategoryDto;
import com.diploma.proforientation.dto.request.create.CreateCategoryRequest;
import com.diploma.proforientation.model.ProfessionCategory;
import com.diploma.proforientation.repository.ProfessionCategoryRepository;
import com.diploma.proforientation.service.impl.ProfessionCategoryServiceImpl;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProfessionCategoryServiceTest {

    @Mock
    private ProfessionCategoryRepository repo;

    @InjectMocks
    private ProfessionCategoryServiceImpl service;

    @Test
    void getAll_shouldReturnListOfDtos() {

        ProfessionCategory cat1 = new ProfessionCategory();
        cat1.setId(1);
        cat1.setCode("IT");
        cat1.setName("Information Technology");
        cat1.setColorCode("#000000");

        ProfessionCategory cat2 = new ProfessionCategory();
        cat2.setId(2);
        cat2.setCode("MED");
        cat2.setName("Medicine");
        cat2.setColorCode("#FFFFFF");

        when(repo.findAll()).thenReturn(List.of(cat1, cat2));

        List<ProfessionCategoryDto> result = service.getAll();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).code()).isEqualTo("IT");
        assertThat(result.get(1).code()).isEqualTo("MED");

        verify(repo, times(1)).findAll();
    }

    @Test
    void create_shouldSaveAndReturnDto() {

        CreateCategoryRequest req = new CreateCategoryRequest("IT", "Information Tech", "#123456");

        ProfessionCategory saved = new ProfessionCategory();
        saved.setId(10);
        saved.setCode("IT");
        saved.setName("Information Tech");
        saved.setColorCode("#123456");

        when(repo.save(any())).thenReturn(saved);

        ProfessionCategoryDto result = service.create(req);

        assertThat(result.id()).isEqualTo(10);
        assertThat(result.code()).isEqualTo("IT");

        verify(repo, times(1)).save(any(ProfessionCategory.class));
    }

    @Test
    void update_shouldUpdateExistingCategory() {

        CreateCategoryRequest req = new CreateCategoryRequest("IT2", "New Name", "#999999");

        ProfessionCategory existing = new ProfessionCategory();
        existing.setId(3);
        existing.setCode("OLD");
        existing.setName("Old Name");
        existing.setColorCode("#000000");

        when(repo.findById(3)).thenReturn(Optional.of(existing));
        when(repo.save(existing)).thenReturn(existing);

        ProfessionCategoryDto result = service.update(3, req);

        assertThat(result.code()).isEqualTo("IT2");
        assertThat(result.name()).isEqualTo("New Name");
        assertThat(result.colorCode()).isEqualTo("#999999");

        verify(repo).findById(3);
        verify(repo).save(existing);
    }

    @Test
    void update_shouldThrowExceptionWhenCategoryNotFound() {

        CreateCategoryRequest req = new CreateCategoryRequest("X", "Name", "#000");

        when(repo.findById(100)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(100, req))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Category not found");

        verify(repo).findById(100);
        verify(repo, never()).save(any());
    }

    @Test
    void delete_shouldCallRepositoryDelete() {
        service.delete(5);
        verify(repo, times(1)).deleteById(5);
    }
}