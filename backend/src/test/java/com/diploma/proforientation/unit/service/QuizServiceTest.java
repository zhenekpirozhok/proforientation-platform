package com.diploma.proforientation.unit.service;

import com.diploma.proforientation.dto.QuizDto;
import com.diploma.proforientation.dto.request.create.CreateQuizRequest;
import com.diploma.proforientation.dto.request.update.UpdateQuizRequest;
import com.diploma.proforientation.model.ProfessionCategory;
import com.diploma.proforientation.model.Quiz;
import com.diploma.proforientation.model.User;
import com.diploma.proforientation.model.enumeration.QuizProcessingMode;
import com.diploma.proforientation.repository.ProfessionCategoryRepository;
import com.diploma.proforientation.repository.QuizRepository;
import com.diploma.proforientation.repository.UserRepository;
import com.diploma.proforientation.service.impl.QuizServiceImpl;
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
import static org.mockito.Mockito.*;

class QuizServiceTest {

    @Mock
    private QuizRepository quizRepo;

    @Mock
    private ProfessionCategoryRepository categoryRepo;

    @Mock
    private UserRepository userRepo;
    @Mock
    private TranslationResolver translationResolver;

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

        when(translationResolver.resolve(
                anyString(),
                anyInt(),
                anyString(),
                anyString(),
                anyString()
        )).thenReturn("Quiz Code Test");

        QuizDto result = service.getByCodeLocalized("Q20", "en");

        assertThat(result.id()).isEqualTo(20);
        assertThat(result.title()).isEqualTo("Quiz Code Test");
        verify(quizRepo).findByCode("Q20");
    }

    @Test
    void getByCodeLocalized_shouldThrowWhenNotFound() {
        when(quizRepo.findByCode("NOT_EXIST")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getByCodeLocalized("NOT_EXIST", "en"))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void create_shouldCreateQuiz() {
        CreateQuizRequest req =
                new CreateQuizRequest("QX", "New Quiz", "ML_RIASEC", 5, 1);

        when(categoryRepo.findById(5)).thenReturn(Optional.of(category));
        when(userRepo.findById(1)).thenReturn(Optional.of(author));

        Quiz saved = new Quiz();
        saved.setId(99);
        saved.setCode("QX");
        saved.setTitleDefault("New Quiz");
        saved.setCategory(category);
        saved.setAuthor(author);
        saved.setProcessingMode(QuizProcessingMode.ML_RIASEC);

        when(quizRepo.save(any())).thenReturn(saved);

        QuizDto result = service.create(req);

        assertThat(result.id()).isEqualTo(99);
        assertThat(result.title()).isEqualTo("New Quiz");
        verify(quizRepo).save(any());
    }

    @Test
    void create_shouldThrowWhenCategoryNotFound() {
        CreateQuizRequest req =
                new CreateQuizRequest("QX", "Title", "ml_riasec", 100, 1);

        when(categoryRepo.findById(100)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(req))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void create_shouldThrowWhenAuthorNotFound() {
        CreateQuizRequest req =
                new CreateQuizRequest("QX", "Title", "ml_riasec", 5, 999);

        when(categoryRepo.findById(5)).thenReturn(Optional.of(category));
        when(userRepo.findById(999)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(req))
                .isInstanceOf(EntityNotFoundException.class);
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
                new UpdateQuizRequest("Updated", "ML_RIASEC", 5);

        QuizDto result = service.update(5, req);

        assertThat(result.title()).isEqualTo("Updated");
        verify(quizRepo).save(quiz);
    }

    @Test
    void update_shouldThrowWhenQuizNotFound() {
        when(quizRepo.findById(77)).thenReturn(Optional.empty());

        UpdateQuizRequest req =
                new UpdateQuizRequest("Updated", "ml_riasec", 5);

        assertThatThrownBy(() -> service.update(77, req))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void searchAndSort_shouldReturnFilteredQuizzes() {
        // Prepare test quiz
        Quiz quiz = new Quiz();
        quiz.setId(1);
        quiz.setCode("Q1");
        quiz.setTitleDefault("Test Quiz");
        ProfessionCategory category = new ProfessionCategory();
        category.setId(5);
        quiz.setCategory(category);
        User author = new User();
        author.setId(1);
        quiz.setAuthor(author);

        Pageable pageable = PageRequest.of(0, 10);
        Page<Quiz> page = new PageImpl<>(List.of(quiz), pageable, 1);

        when(quizRepo.findAll(any(Specification.class), eq(pageable))).thenReturn(page);

        when(translationResolver.resolve(anyString(), anyInt(), anyString(), anyString(), anyString()))
                .thenAnswer(invocation -> invocation.getArgument(4)); // return default title/description

        Page<QuizDto> result = service.searchAndSort("Test", "id", "en", pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().getFirst().title()).isEqualTo("Test Quiz");
        verify(quizRepo).findAll(any(Specification.class), eq(pageable));
    }

    @Test
    void searchAndSort_emptySearch_shouldReturnAll() {
        Quiz quiz1 = new Quiz();
        quiz1.setId(1);
        quiz1.setCode("Q1");
        quiz1.setTitleDefault("Quiz One");
        quiz1.setCategory(new ProfessionCategory(){{
            setId(1);
        }});
        quiz1.setAuthor(new User(){{
            setId(1);
        }});

        Quiz quiz2 = new Quiz();
        quiz2.setId(2);
        quiz2.setCode("Q2");
        quiz2.setTitleDefault("Quiz Two");
        quiz2.setCategory(new ProfessionCategory(){{
            setId(2);
        }});
        quiz2.setAuthor(new User(){{
            setId(2);
        }});

        Pageable pageable = PageRequest.of(0, 10);
        Page<Quiz> page = new PageImpl<>(List.of(quiz1, quiz2), pageable, 2);

        when(quizRepo.findAll(any(Specification.class), eq(pageable))).thenReturn(page);
        when(translationResolver.resolve(anyString(), anyInt(), anyString(), anyString(), anyString()))
                .thenAnswer(invocation -> invocation.getArgument(4));

        Page<QuizDto> result = service.searchAndSort(null, "id", "en", pageable);

        assertThat(result.getTotalElements()).isEqualTo(2);
        assertThat(result.getContent().get(0).title()).isEqualTo("Quiz One");
        assertThat(result.getContent().get(1).title()).isEqualTo("Quiz Two");
    }
}