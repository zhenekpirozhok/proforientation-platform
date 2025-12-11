package com.diploma.proforientation.service;

import com.diploma.proforientation.dto.TraitDto;
import com.diploma.proforientation.dto.request.create.CreateTraitRequest;
import com.diploma.proforientation.model.TraitProfile;
import com.diploma.proforientation.repository.TraitProfileRepository;
import com.diploma.proforientation.service.impl.TraitServiceImpl;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class TraitServiceTest {

    @Mock
    private TraitProfileRepository repo;

    @InjectMocks
    private TraitServiceImpl service;

    TraitProfile trait;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);

        trait = new TraitProfile();
        trait.setId(1);
        trait.setCode("A");
        trait.setName("Alpha");
    }

    @Test
    void getAll_shouldReturnList() {
        when(repo.findAll()).thenReturn(List.of(trait));

        List<TraitDto> list = service.getAll();

        assertThat(list).hasSize(1);
        verify(repo).findAll();
    }

    @Test
    void getById_shouldReturn() {
        when(repo.findById(1)).thenReturn(Optional.of(trait));

        TraitDto dto = service.getById(1);

        assertThat(dto.id()).isEqualTo(1);
    }

    @Test
    void getById_shouldFailIfMissing() {
        when(repo.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getById(99))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void create_shouldSaveTrait() {
        CreateTraitRequest req =
                new CreateTraitRequest("B", "Beta", "desc", null);

        TraitProfile saved = new TraitProfile();
        saved.setId(10);
        saved.setCode("B");
        saved.setName("Beta");
        saved.setDescription("desc");

        when(repo.save(any())).thenReturn(saved);

        TraitDto dto = service.create(req);

        assertThat(dto.id()).isEqualTo(10);
        verify(repo).save(any());
    }

    @Test
    void update_shouldModifyTrait() {
        when(repo.findById(1)).thenReturn(Optional.of(trait));
        when(repo.save(trait)).thenReturn(trait);

        CreateTraitRequest req =
                new CreateTraitRequest("AX", "AlphaX", "desc2", null);

        TraitDto dto = service.update(1, req);

        assertThat(dto.code()).isEqualTo("AX");
        verify(repo).save(trait);
    }
}