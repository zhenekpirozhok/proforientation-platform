package com.diploma.proforientation.unit.service;

import com.diploma.proforientation.dto.QuizVersionDto;
import com.diploma.proforientation.model.*;
import com.diploma.proforientation.model.enumeration.QuestionType;
import com.diploma.proforientation.repository.*;
import com.diploma.proforientation.service.impl.QuizVersionServiceImpl;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;

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
        when(questionRepo.findByQuizVersionId(any())).thenReturn(List.of());

        QuizVersionDto dto = service.publishQuiz(10);

        assertThat(dto.version()).isEqualTo(2);

        verify(versionRepo, times(1)).save(argThat(v -> !v.isCurrent()));
        verify(versionRepo, times(1)).save(argThat(v -> v.isCurrent()));
    }

    @Test
    void publishQuiz_shouldHandleNoPreviousVersion() {
        when(quizRepo.findById(10)).thenReturn(Optional.of(quiz));
        when(versionRepo.findTopByQuizIdOrderByVersionDesc(10)).thenReturn(Optional.empty());

        QuizVersion saved = new QuizVersion();
        saved.setId(111);
        saved.setQuiz(quiz);
        saved.setVersion(1);
        saved.setCurrent(true);
        saved.setPublishedAt(Instant.now());

        when(versionRepo.save(any())).thenReturn(saved);

        QuizVersionDto dto = service.publishQuiz(10);

        assertThat(dto.version()).isEqualTo(1);
        verify(questionRepo, never()).findByQuizVersionId(any());
    }

    @Test
    void publishQuiz_shouldCopyQuestions() {
        when(quizRepo.findById(10)).thenReturn(Optional.of(quiz));
        when(versionRepo.findTopByQuizIdOrderByVersionDesc(10))
                .thenReturn(Optional.of(version1));

        Question q = new Question();
        q.setId(500);
        q.setOrd(1);
        q.setQtype(QuestionType.single_choice);
        q.setTextDefault("Some text");

        QuestionOption op = new QuestionOption();
        op.setId(600);
        op.setOrd(1);
        op.setLabelDefault("opt");

        when(questionRepo.findByQuizVersionId(100)).thenReturn(List.of(q));
        when(optionRepo.findByQuestionId(500)).thenReturn(List.of(op));

        when(questionRepo.save(any())).thenReturn(new Question());
        when(optionRepo.save(any())).thenReturn(new QuestionOption());

        QuizVersion newV = new QuizVersion();
        newV.setId(222);
        newV.setQuiz(quiz);
        newV.setVersion(2);

        when(versionRepo.save(any())).thenReturn(newV);

        QuizVersionDto dto = service.publishQuiz(10);

        assertThat(dto.version()).isEqualTo(2);
        verify(questionRepo).save(any());
        verify(optionRepo).save(any());
    }

    @Test
    void publishQuiz_shouldFailIfQuizNotFound() {
        when(quizRepo.findById(999)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.publishQuiz(999))
                .isInstanceOf(EntityNotFoundException.class);
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
        assertThat(dto.isCurrent()).isFalse();
        assertThat(dto.publishedAt()).isNull();
    }

    @Test
    void copyLatestVersion_shouldFailIfQuizNotFound() {
        when(quizRepo.findById(10)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.copyLatestVersion(10))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void copyLatestVersion_shouldFailIfNoVersions() {
        when(quizRepo.findById(10)).thenReturn(Optional.of(quiz));
        when(versionRepo.findTopByQuizIdOrderByVersionDesc(10))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.copyLatestVersion(10))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void getVersionsForQuiz_shouldReturnVersionsSorted() {
        QuizVersion v2 = new QuizVersion();
        v2.setQuiz(quiz);
        v2.setVersion(2);

        when(versionRepo.findByQuizIdOrderByVersionDesc(10))
                .thenReturn(List.of(v2, version1));

        List<QuizVersionDto> list = service.getVersionsForQuiz(10);

        assertThat(list).hasSize(2);
        assertThat(list.get(0).version()).isEqualTo(2);
        assertThat(list.get(1).version()).isEqualTo(1);
    }

    @Test
    void getCurrentVersion_shouldReturnVersion() {
        when(versionRepo.findByQuizIdAndCurrentTrue(10))
                .thenReturn(Optional.of(version1));

        QuizVersionDto dto = service.getCurrentVersion(10);

        assertThat(dto.version()).isEqualTo(1);
    }

    @Test
    void getCurrentVersion_shouldFailIfNotFound() {
        when(versionRepo.findByQuizIdAndCurrentTrue(10))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getCurrentVersion(10))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void getVersion_shouldReturnVersion() {
        when(versionRepo.findByQuizIdAndVersion(10, 1))
                .thenReturn(Optional.of(version1));

        QuizVersionDto dto = service.getVersion(10, 1);

        assertThat(dto.version()).isEqualTo(1);
    }

    @Test
    void getVersion_shouldFailIfNotFound() {
        when(versionRepo.findByQuizIdAndVersion(10, 99))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getVersion(10, 99))
                .isInstanceOf(RuntimeException.class);
    }
}