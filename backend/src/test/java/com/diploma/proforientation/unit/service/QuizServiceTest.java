package com.diploma.proforientation.unit.service;

import com.diploma.proforientation.dto.QuizDto;
import com.diploma.proforientation.dto.request.create.CreateQuizRequest;
import com.diploma.proforientation.dto.request.update.UpdateQuizRequest;
import com.diploma.proforientation.model.ProfessionCategory;
import com.diploma.proforientation.model.Quiz;
import com.diploma.proforientation.model.User;
import com.diploma.proforientation.model.enumeration.QuizProcessingMode;
import com.diploma.proforientation.model.enumeration.QuizStatus;
import com.diploma.proforientation.repository.ProfessionCategoryRepository;
import com.diploma.proforientation.repository.view.QuizPublicMetricsRepository;
import com.diploma.proforientation.repository.QuizRepository;
import com.diploma.proforientation.repository.UserRepository;
import com.diploma.proforientation.service.impl.QuizServiceImpl;
import com.diploma.proforientation.util.I18n;
import com.diploma.proforientation.util.TranslationResolver;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.*;

class QuizServiceTest {

    @Mock
    private QuizRepository quizRepo;

    @Mock
    private ProfessionCategoryRepository categoryRepo;
    @Mock
    private QuizPublicMetricsRepository quizPublicMetricsRepo;

    @Mock
    private UserRepository userRepo;
    @Mock
    private TranslationResolver translationResolver;
    @Mock
    private I18n localeProvider;

    @InjectMocks
    private QuizServiceImpl service;

    ProfessionCategory category;
    User author;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);

        category = new ProfessionCategory();
        category.setId(5);

        author = new User();
        author.setId(1);
    }

    @Test
    void getAll_shouldReturnPage() {
        Quiz quiz = new Quiz();
        quiz.setId(1);
        quiz.setCode("Q1");
        quiz.setTitleDefault("Test");

        Pageable pageable = PageRequest.of(0, 10);
        Page<Quiz> page = new PageImpl<>(List.of(quiz), pageable, 1);

        when(quizRepo.findAll(pageable)).thenReturn(page);

        Page<QuizDto> result = service.getAll(pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().getFirst().title()).isEqualTo("Test");
        verify(quizRepo).findAll(pageable);
    }

    @Test
    void getById_shouldReturnQuiz() {
        Quiz quiz = new Quiz();
        quiz.setId(10);
        quiz.setCode("Q10");
        quiz.setTitleDefault("Quiz Title");

        when(quizRepo.findById(10)).thenReturn(Optional.of(quiz));

        QuizDto result = service.getById(10);

        assertThat(result.id()).isEqualTo(10);
        verify(quizRepo).findById(10);
    }

    @Test
    void getById_shouldThrowWhenNotFound() {
        when(quizRepo.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getById(99))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void getByCodeLocalized_shouldReturnQuiz() {
        Quiz quiz = new Quiz();
        quiz.setId(20);
        quiz.setCode("Q20");
        quiz.setTitleDefault("Quiz Code Test");

        ProfessionCategory category = new ProfessionCategory();
        category.setId(5);
        quiz.setCategory(category);

        User author = new User();
        author.setId(1);
        quiz.setAuthor(author);

        when(quizRepo.findByCode("Q20")).thenReturn(Optional.of(quiz));
        when(localeProvider.currentLanguage()).thenReturn("en");
        when(translationResolver.resolve(
                anyString(),
                anyInt(),
                anyString(),
                anyString(),
                anyString()
        )).thenReturn("Quiz Code Test");

        QuizDto result = service.getByCodeLocalized("Q20");

        assertThat(result.id()).isEqualTo(20);
        assertThat(result.title()).isEqualTo("Quiz Code Test");
        verify(quizRepo).findByCode("Q20");
    }

    @Test
    void getByCodeLocalized_shouldThrowWhenNotFound() {
        when(localeProvider.currentLanguage()).thenReturn("en");
        when(quizRepo.findByCode("NOT_EXIST")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getByCodeLocalized("NOT_EXIST"))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void create_shouldCreateQuiz() {
        CreateQuizRequest req = new CreateQuizRequest(
                "QX",
                "New Quiz",
                "Default quiz description",
                30,
                5
        );

        when(userRepo.findById(1)).thenReturn(Optional.of(author));
        when(categoryRepo.findById(5)).thenReturn(Optional.of(category));

        Quiz saved = new Quiz();
        saved.setId(99);
        saved.setCode("QX");
        saved.setTitleDefault("New Quiz");
        saved.setCategory(category);
        saved.setAuthor(author);

        when(quizRepo.save(any(Quiz.class))).thenReturn(saved);

        QuizDto result = service.create(req, 1);

        assertThat(result.id()).isEqualTo(99);
        assertThat(result.title()).isEqualTo("New Quiz");

        verify(userRepo).findById(1);
        verify(categoryRepo).findById(5);
        verify(quizRepo).save(any(Quiz.class));
    }

    @Test
    void create_shouldThrowWhenCategoryNotFound() {
        CreateQuizRequest req = new CreateQuizRequest(
                "QX",
                "Title",
                "desc",
                30,
                100
        );

        when(userRepo.findById(1)).thenReturn(Optional.of(author));
        when(categoryRepo.findById(100)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(req, 1))
                .isInstanceOf(EntityNotFoundException.class);

        verify(categoryRepo).findById(100);
        verify(quizRepo, never()).save(any());
    }

    @Test
    void create_shouldThrowWhenSecondsPerQuestionInvalid() {
        CreateQuizRequest req = new CreateQuizRequest(
                "QX",
                "Title",
                "desc",
                0,
                null
        );

        when(userRepo.findById(1)).thenReturn(Optional.of(author));

        assertThatThrownBy(() -> service.create(req, 1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("seconds");

        verify(quizRepo, never()).save(any());
    }

    @Test
    void update_shouldModifyQuiz() {
        Quiz quiz = new Quiz();
        quiz.setId(5);
        quiz.setTitleDefault("Old");
        quiz.setProcessingMode(QuizProcessingMode.ML_RIASEC);

        when(quizRepo.findById(5)).thenReturn(Optional.of(quiz));
        when(categoryRepo.findById(5)).thenReturn(Optional.of(category));
        when(quizRepo.save(quiz)).thenReturn(quiz);

        UpdateQuizRequest req =
                new UpdateQuizRequest("Updated", "ML_RIASEC", null, null,30,5);

        QuizDto result = service.update(5, req);

        assertThat(result.title()).isEqualTo("Updated");
        verify(quizRepo).save(quiz);
    }

    @Test
    void update_shouldThrowWhenQuizNotFound() {
        when(quizRepo.findById(77)).thenReturn(Optional.empty());

        UpdateQuizRequest req =
                new UpdateQuizRequest("Updated", "ml_riasec", null, null, 30,5);

        assertThatThrownBy(() -> service.update(77, req))
                .isInstanceOf(EntityNotFoundException.class);
    }

@Test
void getByAuthor_shouldReturnPageOfQuizzes() {
    Quiz quiz1 = new Quiz();
    quiz1.setId(1);
    quiz1.setTitleDefault("Quiz 1");
    quiz1.setAuthor(author);

    Quiz quiz2 = new Quiz();
    quiz2.setId(2);
    quiz2.setTitleDefault("Quiz 2");
    quiz2.setAuthor(author);

    Pageable pageable = PageRequest.of(0, 10);
    Page<Quiz> page = new PageImpl<>(List.of(quiz1, quiz2), pageable, 2);

    when(quizRepo.findAll(any(Specification.class), eq(pageable))).thenReturn(page);

    when(localeProvider.currentLanguage()).thenReturn("en");

    when(translationResolver.resolve(
            anyString(), anyInt(), anyString(), eq("en"), anyString()
    )).thenAnswer(invocation -> invocation.getArgument(4)); 

    Page<QuizDto> result = service.getByAuthor(author.getId(), pageable);

    assertThat(result.getTotalElements()).isEqualTo(2);
    assertThat(result.getContent().get(0).title()).isEqualTo("Quiz 1");
    assertThat(result.getContent().get(1).title()).isEqualTo("Quiz 2");

    verify(quizRepo).findAll(any(Specification.class), eq(pageable));
    verify(localeProvider).currentLanguage();
    verify(translationResolver, times(2))
            .resolve(anyString(), anyInt(), anyString(), eq("en"), anyString());
}


    @Test
    void search_withSearchAndCategory_returnsLocalizedDtos() {
        Quiz quiz = new Quiz();
        quiz.setId(1);
        quiz.setCode("Q1");
        quiz.setTitleDefault("Test Quiz");
        quiz.setDescriptionDefault("Desc");

        ProfessionCategory category = new ProfessionCategory();
        category.setId(5);
        quiz.setCategory(category);

        User author = new User();
        author.setId(1);
        quiz.setAuthor(author);

        Pageable pageable = PageRequest.of(0, 10);
        Page<Quiz> page = new PageImpl<>(List.of(quiz), pageable, 1);

        when(localeProvider.currentLanguage()).thenReturn("en");

        when(translationResolver.resolve(anyString(), anyInt(), anyString(), eq("en"), anyString()))
                .thenAnswer(inv -> inv.getArgument(4));

        when(quizRepo.findAll(any(Specification.class), eq(pageable))).thenReturn(page);

        Page<QuizDto> result = service.search(
                "Test",
                5,
                null,
                null,
                pageable
        );

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().getFirst().title()).isEqualTo("Test Quiz");

        verifyNoInteractions(quizPublicMetricsRepo);

        verify(quizRepo).findAll(any(Specification.class), eq(pageable));
    }

    @Test
    void search_withoutSearch_returnsAll() {
        Quiz quiz1 = new Quiz();
        quiz1.setId(1);
        quiz1.setCode("Q1");
        quiz1.setTitleDefault("Quiz One");
        quiz1.setDescriptionDefault("D1");
        quiz1.setCategory(new ProfessionCategory() {{ setId(1); }});
        quiz1.setAuthor(new User() {{ setId(1); }});

        Quiz quiz2 = new Quiz();
        quiz2.setId(2);
        quiz2.setCode("Q2");
        quiz2.setTitleDefault("Quiz Two");
        quiz2.setDescriptionDefault("D2");
        quiz2.setCategory(new ProfessionCategory() {{ setId(2); }});
        quiz2.setAuthor(new User() {{ setId(2); }});

        Pageable pageable = PageRequest.of(0, 10);
        Page<Quiz> page = new PageImpl<>(List.of(quiz1, quiz2), pageable, 2);

        when(localeProvider.currentLanguage()).thenReturn("en");
        when(translationResolver.resolve(anyString(), anyInt(), anyString(), eq("en"), anyString()))
                .thenAnswer(inv -> inv.getArgument(4));

        when(quizRepo.findAll(any(Specification.class), eq(pageable))).thenReturn(page);

        Page<QuizDto> result = service.search(
                null,
                null,
                null,
                null,
                pageable
        );

        assertThat(result.getTotalElements()).isEqualTo(2);
        assertThat(result.getContent().get(0).title()).isEqualTo("Quiz One");
        assertThat(result.getContent().get(1).title()).isEqualTo("Quiz Two");

        verifyNoInteractions(quizPublicMetricsRepo);
        verify(quizRepo).findAll(any(Specification.class), eq(pageable));
    }

    @Test
    void search_withDurationFilter_callsMetricsRepo_andFiltersByIds() {
        Quiz quiz = new Quiz();
        quiz.setId(10);
        quiz.setCode("Q10");
        quiz.setTitleDefault("Quiz 10");
        quiz.setDescriptionDefault("D10");
        quiz.setCategory(new ProfessionCategory() {{ setId(1); }});
        quiz.setAuthor(new User() {{ setId(1); }});

        Pageable pageable = PageRequest.of(0, 10);
        Page<Quiz> page = new PageImpl<>(List.of(quiz), pageable, 1);

        when(localeProvider.currentLanguage()).thenReturn("en");
        when(translationResolver.resolve(anyString(), anyInt(), anyString(), eq("en"), anyString()))
                .thenAnswer(inv -> inv.getArgument(4));

        when(quizPublicMetricsRepo.findQuizIdsByDuration(300, 900))
                .thenReturn(List.of(10));

        when(quizRepo.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(page);

        Page<QuizDto> result = service.search(
                null,
                null,
                300,
                900,
                pageable
        );

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().getFirst().id()).isEqualTo(10);

        verify(quizPublicMetricsRepo).findQuizIdsByDuration(300, 900);
        verify(quizRepo).findAll(any(Specification.class), eq(pageable));
    }

    @Test
    void search_withDurationFilter_noIds_returnsEmptyPage_andDoesNotCallQuizRepo() {
        Pageable pageable = PageRequest.of(0, 10);

        when(quizPublicMetricsRepo.findQuizIdsByDuration(300, 900))
                .thenReturn(List.of());

        Page<QuizDto> result = service.search(
                null,
                null,
                300,
                900,
                pageable
        );

        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isZero();

        verify(quizPublicMetricsRepo).findQuizIdsByDuration(300, 900);
        verifyNoInteractions(quizRepo);
    }

    @Test
    void getAllLocalized_shouldFetchOnlyPublished_andLocalize() {
        Quiz quiz = new Quiz();
        quiz.setId(1);
        quiz.setCode("Q1");
        quiz.setTitleDefault("Default title");
        quiz.setDescriptionDefault("Default desc");
        quiz.setStatus(QuizStatus.PUBLISHED);
        quiz.setProcessingMode(QuizProcessingMode.LLM);
        quiz.setAuthor(author);

        Pageable pageable = PageRequest.of(0, 10);

        when(localeProvider.currentLanguage()).thenReturn("en");
        when(quizRepo.findAllByStatus(eq(QuizStatus.PUBLISHED), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(quiz), pageable, 1));

        when(translationResolver.resolve(anyString(), anyInt(), anyString(), eq("en"), anyString()))
                .thenAnswer(inv -> inv.getArgument(4));

        Page<QuizDto> result = service.getAllLocalized(pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().getFirst().title()).isEqualTo("Default title");

        verify(localeProvider).currentLanguage();
        verify(quizRepo).findAllByStatus(eq(QuizStatus.PUBLISHED), eq(pageable));
        verify(translationResolver, times(2))
                .resolve(anyString(), eq(1), anyString(), eq("en"), anyString());
    }

    @Test
    void getByIdLocalized_shouldReturnLocalizedDto() {
        Quiz quiz = new Quiz();
        quiz.setId(10);
        quiz.setCode("Q10");
        quiz.setTitleDefault("T");
        quiz.setDescriptionDefault("D");
        quiz.setStatus(com.diploma.proforientation.model.enumeration.QuizStatus.PUBLISHED);
        quiz.setProcessingMode(QuizProcessingMode.LLM);
        quiz.setAuthor(author);

        when(localeProvider.currentLanguage()).thenReturn("en");
        when(quizRepo.findById(10)).thenReturn(Optional.of(quiz));

        when(translationResolver.resolve(anyString(), anyInt(), anyString(), eq("en"), any()))
                .thenAnswer(inv -> inv.getArgument(4));

        QuizDto dto = service.getByIdLocalized(10);

        assertThat(dto.id()).isEqualTo(10);
        assertThat(dto.title()).isEqualTo("T");
        assertThat(dto.descriptionDefault()).isEqualTo("D");

        verify(localeProvider).currentLanguage();
        verify(translationResolver, times(2)).resolve(anyString(), eq(10), anyString(), eq("en"), any());
    }

    @Test
    void create_shouldThrowWhenAuthorNotFound() {
        CreateQuizRequest req = new CreateQuizRequest("Q1", "Title", null, null, null);

        when(userRepo.findById(999)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(req, 999))
                .isInstanceOf(EntityNotFoundException.class);

        verify(quizRepo, never()).save(any());
    }

    @Test
    void create_whenCategoryIdNull_shouldNotCallCategoryRepo() {
        CreateQuizRequest req = new CreateQuizRequest("Q1", "Title", "desc", 30, null);

        when(userRepo.findById(1)).thenReturn(Optional.of(author));

        Quiz saved = new Quiz();
        saved.setId(1);
        saved.setCode("Q1");
        saved.setTitleDefault("Title");
        saved.setDescriptionDefault("desc");
        saved.setSecondsPerQuestionDefault(30);
        saved.setAuthor(author);
        saved.setStatus(com.diploma.proforientation.model.enumeration.QuizStatus.DRAFT);
        saved.setProcessingMode(QuizProcessingMode.LLM);

        when(quizRepo.save(any(Quiz.class))).thenReturn(saved);

        QuizDto dto = service.create(req, 1);

        assertThat(dto.id()).isEqualTo(1);
        verifyNoInteractions(categoryRepo);
    }

    @Test
    void update_whenAllFieldsNull_shouldOnlyUpdateUpdatedAt_andSave() {
        Quiz quiz = new Quiz();
        quiz.setId(5);
        quiz.setCode("Q5");
        quiz.setTitleDefault("Old");
        quiz.setStatus(com.diploma.proforientation.model.enumeration.QuizStatus.DRAFT);
        quiz.setProcessingMode(QuizProcessingMode.LLM);
        quiz.setAuthor(author);

        when(quizRepo.findById(5)).thenReturn(Optional.of(quiz));
        when(quizRepo.save(any(Quiz.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateQuizRequest req = new UpdateQuizRequest(null, null, null, null, null, null);

        QuizDto dto = service.update(5, req);

        assertThat(dto.title()).isEqualTo("Old");
        verify(quizRepo).save(quiz);
        verifyNoInteractions(categoryRepo);
    }

    @Test
    void update_invalidProcessingMode_shouldThrowIllegalArgumentException() {
        Quiz quiz = new Quiz();
        quiz.setId(5);
        quiz.setStatus(com.diploma.proforientation.model.enumeration.QuizStatus.DRAFT);
        quiz.setProcessingMode(QuizProcessingMode.LLM);
        quiz.setAuthor(author);

        when(quizRepo.findById(5)).thenReturn(Optional.of(quiz));

        UpdateQuizRequest req = new UpdateQuizRequest(null, "NOT_A_MODE", null, null, null, null);

        assertThatThrownBy(() -> service.update(5, req))
                .isInstanceOf(IllegalArgumentException.class);

        verify(quizRepo, never()).save(any());
    }

    @Test
    void update_invalidStatus_shouldThrowIllegalArgumentException() {
        Quiz quiz = new Quiz();
        quiz.setId(5);
        quiz.setStatus(com.diploma.proforientation.model.enumeration.QuizStatus.DRAFT);
        quiz.setProcessingMode(QuizProcessingMode.LLM);
        quiz.setAuthor(author);

        when(quizRepo.findById(5)).thenReturn(Optional.of(quiz));

        UpdateQuizRequest req = new UpdateQuizRequest(null, null, "NOT_A_STATUS", null, null, null);

        assertThatThrownBy(() -> service.update(5, req))
                .isInstanceOf(IllegalArgumentException.class);

        verify(quizRepo, never()).save(any());
    }

    @Test
    void update_secondsPerQuestionInvalid_shouldThrowIllegalArgumentException() {
        Quiz quiz = new Quiz();
        quiz.setId(5);
        quiz.setStatus(com.diploma.proforientation.model.enumeration.QuizStatus.DRAFT);
        quiz.setProcessingMode(QuizProcessingMode.LLM);
        quiz.setAuthor(author);

        when(quizRepo.findById(5)).thenReturn(Optional.of(quiz));

        UpdateQuizRequest req = new UpdateQuizRequest(null, null, null, null, 0, null);

        assertThatThrownBy(() -> service.update(5, req))
                .isInstanceOf(IllegalArgumentException.class);

        verify(quizRepo, never()).save(any());
    }

    @Test
    void delete_shouldArchiveQuiz() {
        Quiz quiz = new Quiz();
        quiz.setId(7);
        quiz.setStatus(QuizStatus.DRAFT);

        when(quizRepo.findById(7)).thenReturn(Optional.of(quiz));

        service.delete(7);

        assertEquals(QuizStatus.ARCHIVED, quiz.getStatus());
        verify(quizRepo).save(quiz);
        verify(quizRepo, never()).delete(org.mockito.Mockito.any(Quiz.class));
    }

    @Test
    void delete_shouldThrowWhenNotFound() {
        when(quizRepo.findById(7)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.delete(7))
                .isInstanceOf(EntityNotFoundException.class);

        verify(quizRepo, never()).delete(any(Quiz.class));
    }

    @Test
    void search_blankSearchString_shouldBehaveLikeNoSearch() {
        Quiz quiz = new Quiz();
        quiz.setId(1);
        quiz.setCode("Q1");
        quiz.setTitleDefault("Quiz One");
        quiz.setDescriptionDefault("Desc");
        quiz.setCategory(new ProfessionCategory() {{ setId(1); }});
        quiz.setAuthor(new User() {{ setId(1); }});
        quiz.setStatus(com.diploma.proforientation.model.enumeration.QuizStatus.PUBLISHED);
        quiz.setProcessingMode(QuizProcessingMode.LLM);

        Pageable pageable = PageRequest.of(0, 10);
        when(localeProvider.currentLanguage()).thenReturn("en");
        when(translationResolver.resolve(anyString(), anyInt(), anyString(), eq("en"), anyString()))
                .thenAnswer(inv -> inv.getArgument(4));

        when(quizRepo.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(quiz), pageable, 1));

        Page<QuizDto> result = service.search("   ", null, null, null, pageable);

        assertThat(result.getContent()).hasSize(1);
        verify(quizRepo).findAll(any(Specification.class), eq(pageable));
        verifyNoInteractions(quizPublicMetricsRepo);
    }

    @Test
    void search_durationFilterOnlyMin_callsMetricsRepo() {
        Pageable pageable = PageRequest.of(0, 10);

        when(quizPublicMetricsRepo.findQuizIdsByDuration(300, null)).thenReturn(List.of(1));
        when(localeProvider.currentLanguage()).thenReturn("en");
        when(translationResolver.resolve(anyString(), anyInt(), anyString(), eq("en"), anyString()))
                .thenAnswer(inv -> inv.getArgument(4));

        Quiz quiz = new Quiz();
        quiz.setId(1);
        quiz.setCode("Q1");
        quiz.setTitleDefault("T");
        quiz.setDescriptionDefault("D");
        quiz.setCategory(new ProfessionCategory() {{ setId(1); }});
        quiz.setAuthor(new User() {{ setId(1); }});
        quiz.setStatus(com.diploma.proforientation.model.enumeration.QuizStatus.PUBLISHED);
        quiz.setProcessingMode(QuizProcessingMode.LLM);

        when(quizRepo.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(quiz), pageable, 1));

        Page<QuizDto> result = service.search(null, null, 300, null, pageable);

        assertThat(result.getContent()).hasSize(1);
        verify(quizPublicMetricsRepo).findQuizIdsByDuration(300, null);
        verify(quizRepo).findAll(any(Specification.class), eq(pageable));
    }

}