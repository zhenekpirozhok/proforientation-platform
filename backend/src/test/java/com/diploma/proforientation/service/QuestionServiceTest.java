package com.diploma.proforientation.service;

import com.diploma.proforientation.dto.OptionDto;
import com.diploma.proforientation.dto.QuestionDto;
import com.diploma.proforientation.dto.request.create.CreateQuestionRequest;
import com.diploma.proforientation.dto.request.update.UpdateQuestionRequest;
import com.diploma.proforientation.model.Question;
import com.diploma.proforientation.model.QuestionOption;
import com.diploma.proforientation.model.QuizVersion;
import com.diploma.proforientation.model.Translation;
import com.diploma.proforientation.model.enumeration.QuestionType;
import com.diploma.proforientation.repository.QuestionOptionRepository;
import com.diploma.proforientation.repository.QuestionRepository;
import com.diploma.proforientation.repository.QuizVersionRepository;
import com.diploma.proforientation.repository.TranslationRepository;
import com.diploma.proforientation.service.impl.QuestionServiceImpl;
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

    // -------------------------------------------------------------------------
    // EXISTING TESTS (unchanged)
    // -------------------------------------------------------------------------

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
        verify(questionRepo).save(any());
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
    void delete_shouldCallRepository() {
        service.delete(3);
        verify(questionRepo).deleteById(3);
    }

    // -------------------------------------------------------------------------
    // NEW TESTS: update() when missing
    // -------------------------------------------------------------------------
    @Test
    void update_shouldFailWhenNotFound() {
        when(questionRepo.findById(999)).thenReturn(Optional.empty());

        UpdateQuestionRequest req = new UpdateQuestionRequest(1, "single_choice", "X");

        assertThatThrownBy(() -> service.update(999, req))
                .isInstanceOf(EntityNotFoundException.class);
    }

    // -------------------------------------------------------------------------
    // NEW TESTS: updateOrder()
    // -------------------------------------------------------------------------
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

    // -------------------------------------------------------------------------
    // NEW TESTS: getQuestionsForCurrentVersion()
    // -------------------------------------------------------------------------
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

        when(questionRepo.findByQuizVersionIdOrderByOrd(5))
                .thenReturn(List.of(q));

        // Localized question text
        when(translationRepo.findByEntityTypeAndEntityIdAndFieldAndLocale(
                "question", 100, "text", "ru"))
                .thenReturn(Optional.of(new Translation(1, "question", 100, "ru", "text", "Перевод вопроса")));

        // Option
        QuestionOption opt = new QuestionOption();
        opt.setId(200);
        opt.setOrd(1);
        opt.setQuestion(q);
        opt.setLabelDefault("Default option");

        when(optionRepo.findByQuestionIdOrderByOrd(100))
                .thenReturn(List.of(opt));

        // Localized option text
        when(translationRepo.findByEntityTypeAndEntityIdAndFieldAndLocale(
                "question_option", 200, "text", "ru"))
                .thenReturn(Optional.of(new Translation(1, "question_option", 200, "ru", "text", "Перевод ответа")));

        List<QuestionDto> result = service.getQuestionsForCurrentVersion(7, "ru");

        assertThat(result).hasSize(1);
        QuestionDto dto = result.getFirst();

        assertThat(dto.text()).isEqualTo("Перевод вопроса");
        assertThat(dto.options()).hasSize(1);

        OptionDto o = dto.options().getFirst();
        assertThat(o.label()).isEqualTo("Перевод ответа");
    }

    // -------------------------------------------------------------------------
    // NEW TESTS: getQuestionsForVersion()
    // -------------------------------------------------------------------------
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

        when(questionRepo.findByQuizVersionIdOrderByOrd(9))
                .thenReturn(List.of(q));

        when(optionRepo.findByQuestionIdOrderByOrd(77))
                .thenReturn(List.of());

        when(translationRepo.findByEntityTypeAndEntityIdAndFieldAndLocale(any(), any(), any(), any()))
                .thenReturn(Optional.empty());

        List<QuestionDto> list = service.getQuestionsForVersion(3, 1, "en");

        assertThat(list).hasSize(1);
        assertThat(list.getFirst().text()).isEqualTo("Default");
    }
}