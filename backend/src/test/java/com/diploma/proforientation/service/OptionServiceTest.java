package com.diploma.proforientation.service;

import com.diploma.proforientation.dto.OptionDto;
import com.diploma.proforientation.dto.request.create.CreateOptionRequest;
import com.diploma.proforientation.dto.request.update.UpdateOptionRequest;
import com.diploma.proforientation.model.Question;
import com.diploma.proforientation.model.QuestionOption;
import com.diploma.proforientation.repository.QuestionOptionRepository;
import com.diploma.proforientation.repository.QuestionRepository;
import com.diploma.proforientation.service.impl.OptionServiceImpl;
import com.diploma.proforientation.util.TranslationResolver;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class OptionServiceTest {

    @Mock
    private QuestionOptionRepository optionRepo;

    @Mock
    private QuestionRepository questionRepo;

    @InjectMocks
    private OptionServiceImpl service;

    @Mock
    private TranslationResolver translationResolver;

    private Question question;
    private QuestionOption opt;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);

        question = new Question();
        question.setId(2);

        opt = new QuestionOption();
        opt.setId(10);
        opt.setOrd(1);
        opt.setLabelDefault("Default Label");
        opt.setQuestion(question);
    }

    @Test
    void create_shouldSaveOption() {
        CreateOptionRequest req = new CreateOptionRequest(2, 1, "Yes");

        when(questionRepo.findById(2)).thenReturn(Optional.of(question));

        QuestionOption saved = new QuestionOption();
        saved.setId(10);
        saved.setQuestion(question);
        saved.setOrd(1);
        saved.setLabelDefault("Yes");

        when(optionRepo.save(any())).thenReturn(saved);

        OptionDto dto = service.create(req);

        assertThat(dto.id()).isEqualTo(10);
        verify(optionRepo).save(any());
    }

    @Test
    void update_shouldModifyOption() {
        QuestionOption opt = new QuestionOption();
        opt.setId(5);
        opt.setQuestion(question);
        opt.setOrd(1);
        opt.setLabelDefault("Old");

        when(optionRepo.findById(5)).thenReturn(Optional.of(opt));
        when(optionRepo.save(opt)).thenReturn(opt);

        UpdateOptionRequest req = new UpdateOptionRequest(2, "New Label");

        OptionDto dto = service.update(5, req);

        assertThat(dto.ord()).isEqualTo(2);
        assertThat(dto.label()).isEqualTo("New Label");
    }

    @Test
    void delete_shouldDelegate() {
        service.delete(7);
        verify(optionRepo).deleteById(7);
    }

    @Test
    void getByQuestionLocalized_shouldReturnLocalizedOptions() {
        when(questionRepo.findById(5)).thenReturn(Optional.of(question));

        when(optionRepo.findByQuestionIdOrderByOrd(5))
                .thenReturn(List.of(opt));

        when(translationResolver.resolve("question_option", 10, "text", "ru", "Default Label"))
                .thenReturn("Локализованный текст");

        List<OptionDto> result = service.getByQuestionLocalized(5, "ru");

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().label()).isEqualTo("Локализованный текст");

        verify(optionRepo).findByQuestionIdOrderByOrd(5);
        verify(translationResolver).resolve("question_option", 10, "text", "ru", "Default Label");
    }

    @Test
    void getByQuestionLocalized_shouldThrowIfQuestionNotFound() {
        when(questionRepo.findById(5)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getByQuestionLocalized(5, "en"))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessage("Question not found");
    }
}