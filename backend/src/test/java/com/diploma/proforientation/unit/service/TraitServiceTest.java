package com.diploma.proforientation.unit.service;

import com.diploma.proforientation.dto.TraitDto;
import com.diploma.proforientation.dto.request.create.CreateTraitRequest;
import com.diploma.proforientation.model.TraitProfile;
import com.diploma.proforientation.repository.TraitProfileRepository;
import com.diploma.proforientation.service.impl.TraitServiceImpl;
import com.diploma.proforientation.util.I18n;
import com.diploma.proforientation.util.TranslationResolver;
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
    @Mock private TranslationResolver translationResolver;
    @Mock private I18n i18n;

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

    @Test
    void getTraitsForQuizVersion_shouldReturnLocalizedDtos() {
        when(i18n.currentLanguage()).thenReturn("en");

        TraitProfile t1 = new TraitProfile();
        t1.setId(1);
        t1.setCode("realistic");
        t1.setName("Realistic");
        t1.setDescription("desc1");
        t1.setBipolarPairCode(null);

        TraitProfile t2 = new TraitProfile();
        t2.setId(2);
        t2.setCode("analytical");
        t2.setName("Analytical");
        t2.setDescription("desc2");
        t2.setBipolarPairCode("realistic");

        when(repo.findTraitsForQuiz(10)).thenReturn(List.of(t1, t2));

        when(translationResolver.resolve(anyString(), eq(1), anyString(), eq("en"), eq("Realistic")))
                .thenReturn("Realistic");
        when(translationResolver.resolve(anyString(), eq(1), anyString(), eq("en"), eq("desc1")))
                .thenReturn("desc1");

        when(translationResolver.resolve(anyString(), eq(2), anyString(), eq("en"), eq("Analytical")))
                .thenReturn("Analytical");
        when(translationResolver.resolve(anyString(), eq(2), anyString(), eq("en"), eq("desc2")))
                .thenReturn("desc2");

        List<TraitDto> result = service.getTraitsForQuizVersion(10);

        assertThat(result).hasSize(2);

        assertThat(result.getFirst().id()).isEqualTo(1);
        assertThat(result.getFirst().code()).isEqualTo("realistic");
        assertThat(result.getFirst().name()).isEqualTo("Realistic");
        assertThat(result.get(0).description()).isEqualTo("desc1");
        assertThat(result.get(0).bipolarPairCode()).isNull();

        assertThat(result.get(1).id()).isEqualTo(2);
        assertThat(result.get(1).code()).isEqualTo("analytical");
        assertThat(result.get(1).name()).isEqualTo("Analytical");
        assertThat(result.get(1).description()).isEqualTo("desc2");
        assertThat(result.get(1).bipolarPairCode()).isEqualTo("realistic");

        verify(repo).findTraitsForQuiz(10);
        verify(translationResolver, times(4)).resolve(anyString(), anyInt(), anyString(), anyString(), anyString());
    }
}