package com.diploma.proforientation.service;

import com.diploma.proforientation.dto.QuizVersionDto;
import com.diploma.proforientation.model.*;
import com.diploma.proforientation.repository.*;
import com.diploma.proforientation.service.impl.QuizVersionServiceImpl;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class QuizVersionServiceTest {

    @Mock private QuizRepository quizRepo;
    @Mock private QuizVersionRepository versionRepo;
    @Mock private QuestionRepository questionRepo;
    @Mock private QuestionOptionRepository optionRepo;

    @InjectMocks
    private QuizVersionServiceImpl service;

    Quiz quiz;
    QuizVersion version1;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);

        quiz = new Quiz();
        quiz.setId(10);

        version1 = new QuizVersion();
        version1.setId(100);
        version1.setQuiz(quiz);
        version1.setVersion(1);
        version1.setCurrent(true);
    }

    @Test
    void publishQuiz_shouldCreateNewVersion() {
        when(quizRepo.findById(10)).thenReturn(Optional.of(quiz));
        when(versionRepo.findTopByQuizIdOrderByVersionDesc(10))
                .thenReturn(Optional.of(version1));

        QuizVersion newV = new QuizVersion();
        newV.setId(200);
        newV.setQuiz(quiz);
        newV.setVersion(2);
        newV.setCurrent(true);
        newV.setPublishedAt(Instant.now());

        when(versionRepo.save(any())).thenReturn(newV);

        QuizVersionDto dto = service.publishQuiz(10);

        assertThat(dto.version()).isEqualTo(2);
        verify(versionRepo, times(2)).save(any());
    }

    @Test
    void copyLatestVersion_shouldCopyVersion() {
        when(quizRepo.findById(10)).thenReturn(Optional.of(quiz));
        when(versionRepo.findTopByQuizIdOrderByVersionDesc(10))
                .thenReturn(Optional.of(version1));

        QuizVersion newV = new QuizVersion();
        newV.setId(300);
        newV.setQuiz(quiz);
        newV.setVersion(2);
        newV.setCurrent(false);

        when(versionRepo.save(any())).thenReturn(newV);

        when(questionRepo.findByQuizVersionId(100)).thenReturn(List.of());
        when(optionRepo.findByQuestionId(any())).thenReturn(List.of());

        QuizVersionDto dto = service.copyLatestVersion(10);

        assertThat(dto.version()).isEqualTo(2);
    }

    @Test
    void publishQuiz_shouldFailIfQuizNotFound() {
        when(quizRepo.findById(999)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.publishQuiz(999))
                .isInstanceOf(EntityNotFoundException.class);
    }
}