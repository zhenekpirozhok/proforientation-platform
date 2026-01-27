package com.diploma.proforientation.unit.service;

import com.diploma.proforientation.dto.QuizVersionDto;
import com.diploma.proforientation.model.*;
import com.diploma.proforientation.model.enumeration.QuestionType;
import com.diploma.proforientation.model.enumeration.QuizStatus;
import com.diploma.proforientation.repository.*;
import com.diploma.proforientation.service.impl.QuizVersionServiceImpl;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static com.diploma.proforientation.util.Constants.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class QuizVersionServiceTest {

    @Mock private QuizRepository quizRepo;
    @Mock private QuizVersionRepository versionRepo;
    @Mock private QuestionRepository questionRepo;
    @Mock private QuestionOptionRepository optionRepo;
    @Mock private QuestionOptionTraitRepository qotRepo;

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
    void publishQuizVersion_shouldMarkGivenVersionAsCurrent_andPublishQuiz() {
        Integer versionId = 100;
        Integer quizId = 10;

        quiz.setId(quizId);
        version1.setId(versionId);
        version1.setQuiz(quiz);
        version1.setPublishedAt(null);
        version1.setCurrent(false);

        when(versionRepo.findById(versionId)).thenReturn(Optional.of(version1));
        when(versionRepo.save(any(QuizVersion.class))).thenAnswer(inv -> inv.getArgument(0));
        when(quizRepo.save(any(Quiz.class))).thenAnswer(inv -> inv.getArgument(0));

        QuizVersionDto dto = service.publishQuizVersion(versionId);

        assertThat(dto.quizId()).isEqualTo(quizId);
        assertThat(dto.version()).isEqualTo(version1.getVersion());
        assertThat(dto.isCurrent()).isTrue();
        assertThat(dto.publishedAt()).isNotNull();

        verify(versionRepo).clearCurrentForQuiz(quizId);
        verify(versionRepo).save(argThat(v ->
                v == version1 &&
                        v.isCurrent() &&
                        v.getPublishedAt() != null
        ));

        verify(quizRepo).save(argThat(q ->
                q == quiz &&
                        q.getStatus() == QuizStatus.PUBLISHED &&
                        q.getUpdatedAt() != null
        ));

        verify(questionRepo, never()).findByQuizVersionId(any());
        verify(optionRepo, never()).findByQuestionId(any());
        verify(questionRepo, never()).save(any());
        verify(optionRepo, never()).save(any());
    }

    @Test
    void publishQuizVersion_shouldNotOverwritePublishedAt_ifAlreadySet() {
        Integer versionId = 100;
        Integer quizId = 10;

        quiz.setId(quizId);
        version1.setId(versionId);
        version1.setQuiz(quiz);

        Instant alreadyPublished = Instant.parse("2025-01-01T00:00:00Z");
        version1.setPublishedAt(alreadyPublished);
        version1.setCurrent(false);

        when(versionRepo.findById(versionId)).thenReturn(Optional.of(version1));
        when(versionRepo.save(any(QuizVersion.class))).thenAnswer(inv -> inv.getArgument(0));
        when(quizRepo.save(any(Quiz.class))).thenAnswer(inv -> inv.getArgument(0));

        QuizVersionDto dto = service.publishQuizVersion(versionId);

        assertThat(dto.publishedAt()).isEqualTo(alreadyPublished);
        assertThat(dto.isCurrent()).isTrue();

        verify(versionRepo).clearCurrentForQuiz(quizId);
        verify(versionRepo).save(argThat(v ->
                v == version1 &&
                        v.isCurrent() &&
                        v.getPublishedAt().equals(alreadyPublished)
        ));
    }

    @Test
    void publishQuizVersion_shouldFailIfVersionNotFound() {
        Integer versionId = 999;
        when(versionRepo.findById(versionId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.publishQuizVersion(versionId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining(QUIZ_VERSION_NOT_FOUND);

        verify(versionRepo, never()).clearCurrentForQuiz(anyInt());
        verify(versionRepo, never()).save(any());
        verify(quizRepo, never()).save(any());
    }

    @Test
    void publishQuizVersion_shouldFailIfVersionHasNoQuiz_attached() {
        Integer versionId = 100;

        version1.setId(versionId);
        version1.setQuiz(null);

        when(versionRepo.findById(versionId)).thenReturn(Optional.of(version1));

        assertThatThrownBy(() -> service.publishQuizVersion(versionId))
                .isInstanceOf(RuntimeException.class);

        verify(versionRepo, never()).clearCurrentForQuiz(anyInt());
        verify(versionRepo, never()).save(any());
        verify(quizRepo, never()).save(any());
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

    @Test
    void createDraftVersion_shouldCreateDraftFromLatest() {
        when(quizRepo.findById(10)).thenReturn(Optional.of(quiz));
        when(versionRepo.findTopByQuizIdOrderByVersionDesc(10))
                .thenReturn(Optional.of(version1));

        QuizVersion saved = new QuizVersion();
        saved.setId(200);
        saved.setQuiz(quiz);
        saved.setVersion(2);
        saved.setCurrent(false);
        saved.setPublishedAt(null);

        when(versionRepo.save(any())).thenReturn(saved);
        when(questionRepo.findByQuizVersionId(100)).thenReturn(List.of());

        QuizVersionDto dto = service.createDraftVersion(10);

        assertThat(dto.version()).isEqualTo(2);
        assertThat(dto.isCurrent()).isFalse();
        assertThat(dto.publishedAt()).isNull();

        verify(versionRepo).save(argThat(v ->
                !v.isCurrent() &&
                        v.getPublishedAt() == null &&
                        v.getVersion() == 2
        ));
    }

    @Test
    void createDraftVersion_shouldCreateFirstVersionIfNoneExist() {
        when(quizRepo.findById(10)).thenReturn(Optional.of(quiz));
        when(versionRepo.findTopByQuizIdOrderByVersionDesc(10))
                .thenReturn(Optional.empty());

        QuizVersion saved = new QuizVersion();
        saved.setId(101);
        saved.setQuiz(quiz);
        saved.setVersion(1);
        saved.setCurrent(false);
        saved.setPublishedAt(null);

        when(versionRepo.save(any())).thenReturn(saved);

        QuizVersionDto dto = service.createDraftVersion(10);

        assertThat(dto.version()).isEqualTo(1);
        assertThat(dto.isCurrent()).isFalse();
        assertThat(dto.publishedAt()).isNull();

        verify(questionRepo, never()).findByQuizVersionId(any());
    }

    @Test
    void createDraftVersion_shouldCopyQuestionsAndOptions() {
        when(quizRepo.findById(10)).thenReturn(Optional.of(quiz));
        when(versionRepo.findTopByQuizIdOrderByVersionDesc(10))
                .thenReturn(Optional.of(version1));

        Question q = new Question();
        q.setId(500);
        q.setOrd(1);
        q.setQtype(QuestionType.MULTI_CHOICE);
        q.setTextDefault("Question");

        QuestionOption opt = new QuestionOption();
        opt.setId(600);
        opt.setOrd(1);
        opt.setLabelDefault("Option");

        when(questionRepo.findByQuizVersionId(100)).thenReturn(List.of(q));
        when(optionRepo.findByQuestionId(500)).thenReturn(List.of(opt));
        when(qotRepo.findByOptionId(600)).thenReturn(List.of());

        when(questionRepo.save(any())).thenReturn(new Question());
        when(optionRepo.save(any())).thenReturn(new QuestionOption());

        QuizVersion saved = new QuizVersion();
        saved.setId(222);
        saved.setQuiz(quiz);
        saved.setVersion(2);

        when(versionRepo.save(any())).thenReturn(saved);

        QuizVersionDto dto = service.createDraftVersion(10);

        assertThat(dto.version()).isEqualTo(2);

        verify(questionRepo).save(any());
        verify(optionRepo).save(any());
    }

    @Test
    void createDraftVersion_shouldFailIfQuizNotFound() {
        when(quizRepo.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.createDraftVersion(99))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void getVersionById_shouldReturnDto() {
        Integer quizVersionId = 100;

        when(versionRepo.findById(quizVersionId)).thenReturn(Optional.of(version1));

        QuizVersionDto dto = service.getVersionById(quizVersionId);

        assertThat(dto.id()).isEqualTo(100);
        assertThat(dto.quizId()).isEqualTo(10);
        assertThat(dto.version()).isEqualTo(1);
        assertThat(dto.isCurrent()).isTrue();

        verify(versionRepo).findById(quizVersionId);
        verifyNoMoreInteractions(versionRepo);
    }

    @Test
    void getVersionById_shouldFailIfNotFound() {
        Integer quizVersionId = 999;

        when(versionRepo.findById(quizVersionId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getVersionById(quizVersionId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining(QUIZ_VERSION_NOT_FOUND);

        verify(versionRepo).findById(quizVersionId);
        verifyNoMoreInteractions(versionRepo);
    }
}
