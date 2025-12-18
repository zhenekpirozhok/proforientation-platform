package com.diploma.proforientation.unit.service;

import com.diploma.proforientation.dto.QuestionDto;
import com.diploma.proforientation.dto.request.create.CreateQuestionRequest;
import com.diploma.proforientation.dto.request.update.UpdateQuestionRequest;
import com.diploma.proforientation.model.*;
import com.diploma.proforientation.model.enumeration.QuestionType;
import com.diploma.proforientation.repository.*;
import com.diploma.proforientation.service.impl.QuestionServiceImpl;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.*;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class QuestionServiceTest {

    @Mock private QuestionRepository questionRepo;
    @Mock private QuizVersionRepository versionRepo;
    @Mock private QuestionOptionRepository optionRepo;
    @Mock private TranslationRepository translationRepo;

    @InjectMocks private QuestionServiceImpl service;

    private QuizVersion version;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);

        version = new QuizVersion();
        version.setId(1);
    }

    @Test
    void create_shouldCreateQuestion() {
        CreateQuestionRequest req =
                new CreateQuestionRequest(1, 1, "single_choice", "Test question");

        when(versionRepo.findById(1)).thenReturn(Optional.of(version));

        Question q = new Question();
        q.setId(10);
        q.setQuizVersion(version);
        q.setOrd(1);
        q.setQtype(QuestionType.single_choice);
        q.setTextDefault("Test question");

        when(questionRepo.save(any())).thenReturn(q);

        QuestionDto result = service.create(req);

        assertThat(result.id()).isEqualTo(10);
        assertThat(result.text()).isEqualTo("Test question");
    }

    @Test
    void create_shouldFailWhenVersionMissing() {
        CreateQuestionRequest req =
                new CreateQuestionRequest(999, 1, "single_choice", "Test");

        when(versionRepo.findById(999)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(req))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void update_shouldUpdateFields() {
        Question existing = new Question();
        existing.setId(5);
        existing.setOrd(1);
        existing.setQtype(QuestionType.single_choice);
        existing.setTextDefault("Old");
        existing.setQuizVersion(version);

        when(questionRepo.findById(5)).thenReturn(Optional.of(existing));
        when(questionRepo.save(existing)).thenReturn(existing);

        UpdateQuestionRequest req =
                new UpdateQuestionRequest(2, "multi_choice", "Updated");

        QuestionDto result = service.update(5, req);

        assertThat(result.ord()).isEqualTo(2);
        assertThat(result.qtype()).isEqualTo("multi_choice");
        assertThat(result.text()).isEqualTo("Updated");
    }

    @Test
    void update_shouldFailWhenNotFound() {
        when(questionRepo.findById(999)).thenReturn(Optional.empty());

        UpdateQuestionRequest req =
                new UpdateQuestionRequest(1, "single_choice", "X");

        assertThatThrownBy(() -> service.update(999, req))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void delete_shouldCallRepository() {
        service.delete(3);
        verify(questionRepo).deleteById(3);
    }

    @Test
    void updateOrder_shouldChangeOrder() {
        Question q = new Question();
        q.setId(10);
        q.setOrd(1);
        q.setQuizVersion(version);
        q.setQtype(QuestionType.single_choice);
        q.setTextDefault("Text");

        when(questionRepo.findById(10)).thenReturn(Optional.of(q));
        when(questionRepo.save(q)).thenReturn(q);

        QuestionDto dto = service.updateOrder(10, 42);

        assertThat(dto.ord()).isEqualTo(42);
    }

    @Test
    void updateOrder_shouldFailWhenNotFound() {
        when(questionRepo.findById(555)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateOrder(555, 10))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void getQuestionsForCurrentVersion_shouldLocalizeTextAndOptions() {

        QuizVersion qv = new QuizVersion();
        qv.setId(5);

        when(versionRepo.findByQuizIdAndCurrentTrue(7))
                .thenReturn(Optional.of(qv));

        Question q = new Question();
        q.setId(100);
        q.setOrd(1);
        q.setTextDefault("Default Q");
        q.setQtype(QuestionType.single_choice);
        q.setQuizVersion(qv);

        Pageable pageable = PageRequest.of(0, 10);
        Page<Question> page = new PageImpl<>(List.of(q), pageable, 1);

        when(questionRepo.findByQuizVersionIdOrderByOrd(5, pageable))
                .thenReturn(page);

        when(translationRepo.findByEntityTypeAndEntityIdAndFieldAndLocale(
                "question", 100, "text", "ru"))
                .thenReturn(Optional.of(
                        new Translation(1, "question", 100, "ru", "text", "Перевод вопроса")
                ));

        QuestionOption opt = new QuestionOption();
        opt.setId(200);
        opt.setOrd(1);
        opt.setQuestion(q);
        opt.setLabelDefault("Default option");

        when(optionRepo.findByQuestionIdOrderByOrd(100))
                .thenReturn(List.of(opt));

        when(translationRepo.findByEntityTypeAndEntityIdAndFieldAndLocale(
                "question_option", 200, "text", "ru"))
                .thenReturn(Optional.of(
                        new Translation(1, "question_option", 200, "ru", "text", "Перевод ответа")
                ));

        Page<QuestionDto> result =
                service.getQuestionsForCurrentVersion(7, "ru", pageable);

        assertThat(result.getContent()).hasSize(1);
        QuestionDto dto = result.getContent().getFirst();

        assertThat(dto.text()).isEqualTo("Перевод вопроса");
        assertThat(dto.options()).hasSize(1);
        assertThat(dto.options().getFirst().label()).isEqualTo("Перевод ответа");
    }

    @Test
    void getQuestionsForVersion_shouldReturnDefaultWhenNoTranslation() {

        QuizVersion qv = new QuizVersion();
        qv.setId(9);

        when(versionRepo.findByQuizIdAndVersion(3, 1))
                .thenReturn(Optional.of(qv));

        Question q = new Question();
        q.setId(77);
        q.setOrd(1);
        q.setTextDefault("Default");
        q.setQtype(QuestionType.single_choice);
        q.setQuizVersion(qv);

        Pageable pageable = PageRequest.of(0, 10);
        Page<Question> page = new PageImpl<>(List.of(q), pageable, 1);

        when(questionRepo.findByQuizVersionIdOrderByOrd(9, pageable))
                .thenReturn(page);

        when(optionRepo.findByQuestionIdOrderByOrd(77))
                .thenReturn(List.of());

        when(translationRepo.findByEntityTypeAndEntityIdAndFieldAndLocale(any(), any(), any(), any()))
                .thenReturn(Optional.empty());

        Page<QuestionDto> result =
                service.getQuestionsForVersion(3, 1, "en", pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().getFirst().text()).isEqualTo("Default");
    }
}