package com.diploma.proforientation.unit.service;

import com.diploma.proforientation.dto.TranslationDto;
import com.diploma.proforientation.dto.request.create.CreateTranslationRequest;
import com.diploma.proforientation.dto.request.update.UpdateTranslationRequest;
import com.diploma.proforientation.model.Translation;
import com.diploma.proforientation.repository.TranslationRepository;
import com.diploma.proforientation.service.impl.TranslationServiceImpl;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class TranslationServiceTest {

    @Mock
    private TranslationRepository repo;

    @InjectMocks
    private TranslationServiceImpl service;

    Translation translation;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);

        translation = new Translation();
        translation.setId(10);
        translation.setEntityType("quiz");
        translation.setEntityId(1);
        translation.setField("title");
        translation.setLocale("en");
        translation.setText("English Title");
    }

    @Test
    void translate_shouldReturnTranslatedText() {
        when(repo.findByEntityTypeAndEntityIdAndFieldAndLocale("quiz", 1, "title", "en"))
                .thenReturn(Optional.of(translation));

        String result = service.translate("quiz", 1, "title", "en");

        assertThat(result).isEqualTo("English Title");
    }

    @Test
    void translate_shouldReturnNullIfMissing() {
        when(repo.findByEntityTypeAndEntityIdAndFieldAndLocale("quiz", 1, "title", "en"))
                .thenReturn(Optional.empty());

        String result = service.translate("quiz", 1, "title", "en");

        assertThat(result).isNull();
    }

    @Test
    void create_shouldSaveTranslation() {
        CreateTranslationRequest req =
                new CreateTranslationRequest("quiz", 1, "title", "en", "Hello");

        when(repo.save(any())).thenReturn(translation);

        TranslationDto dto = service.create(req);

        assertThat(dto.id()).isEqualTo(10);
        verify(repo).save(any());
    }

    @Test
    void update_shouldModifyTranslation() {
        when(repo.findById(10)).thenReturn(Optional.of(translation));
        when(repo.save(translation)).thenReturn(translation);

        UpdateTranslationRequest req = new UpdateTranslationRequest("Updated");

        TranslationDto dto = service.update(10, req);

        assertThat(dto.text()).isEqualTo("Updated");
        verify(repo).save(translation);
    }

    @Test
    void update_shouldThrowIfMissing() {
        when(repo.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(99, new UpdateTranslationRequest("x")))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void delete_shouldRemoveTranslation() {
        when(repo.existsById(10)).thenReturn(true);

        service.delete(10);

        verify(repo).deleteById(10);
    }

    @Test
    void delete_shouldThrowIfMissing() {
        when(repo.existsById(99)).thenReturn(false);

        assertThatThrownBy(() -> service.delete(99))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessage("Translation not found");
    }


    @Test
    void search_shouldReturnList() {
        when(repo.findByEntityTypeAndEntityIdAndLocale("quiz", 1, "en"))
                .thenReturn(List.of(translation));

        var list = service.search("quiz", 1, "en");

        assertThat(list).hasSize(1);
    }
}