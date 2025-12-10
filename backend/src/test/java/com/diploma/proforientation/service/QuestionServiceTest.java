package com.diploma.proforientation.service;

import com.diploma.proforientation.dto.QuestionDto;
import com.diploma.proforientation.dto.request.create.CreateQuestionRequest;
import com.diploma.proforientation.dto.request.update.UpdateQuestionRequest;
import com.diploma.proforientation.model.Question;
import com.diploma.proforientation.model.QuizVersion;
import com.diploma.proforientation.model.enumeration.QuestionType;
import com.diploma.proforientation.repository.QuestionRepository;
import com.diploma.proforientation.repository.QuizVersionRepository;
import com.diploma.proforientation.service.impl.QuestionServiceImpl;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class QuestionServiceTest {

    @Mock
    private QuestionRepository questionRepo;

    @Mock
    private QuizVersionRepository versionRepo;

    @InjectMocks
    private QuestionServiceImpl service;

    private QuizVersion version;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);

        version = new QuizVersion();
        version.setId(1);
    }

    @Test
    void create_shouldCreateQuestion() {
        CreateQuestionRequest req = new CreateQuestionRequest(1, 1, "single_choice", "Test question");

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
        CreateQuestionRequest req = new CreateQuestionRequest(999, 1, "single_choice", "Test");

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

        QuizVersion version = new QuizVersion();
        version.setId(1);
        existing.setQuizVersion(version);

        when(questionRepo.findById(5)).thenReturn(Optional.of(existing));
        when(questionRepo.save(existing)).thenReturn(existing);

        UpdateQuestionRequest req = new UpdateQuestionRequest(2, "multi_choice", "Updated");

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
}