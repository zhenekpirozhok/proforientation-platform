package com.diploma.proforientation.unit.controller;

import com.diploma.proforientation.controller.QuizController;
import com.diploma.proforientation.dto.QuizDto;
import com.diploma.proforientation.dto.QuizVersionDto;
import com.diploma.proforientation.dto.request.create.CreateQuizRequest;
import com.diploma.proforientation.dto.request.update.UpdateQuizRequest;
import com.diploma.proforientation.service.QuizService;
import com.diploma.proforientation.service.QuizVersionService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Instant;
import java.util.List;
import java.util.Locale;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.AssertionsForClassTypes.assertThatThrownBy;
import static org.mockito.Mockito.*;

class QuizControllerTest {

    @Mock
    private QuizService quizService;

    @Mock
    private QuizVersionService versionService;

    @InjectMocks
    private QuizController controller;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        LocaleContextHolder.setLocale(Locale.of("ru"));
        SecurityContextHolder.clearContext();
    }

    private void setAdmin() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "admin",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                )
        );
    }

    @Test
    void getAll_shouldCallServiceWithLocaleAndPageable() {
        int page = 1;
        int size = 20;
        String sort = "id";
        String locale = "ru";

        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(sort));

        QuizDto dto = new QuizDto(1, "quiz1", "Тест 1", "published", "ml", 3, 2, null, 30);
        Page<QuizDto> pageResult = new PageImpl<>(List.of(dto), pageable, 1);

        when(quizService.getAllLocalized(locale, pageable)).thenReturn(pageResult);

        Page<QuizDto> result = controller.getAll(page, size, sort);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().getFirst().title()).isEqualTo("Тест 1");

        verify(quizService).getAllLocalized(locale, pageable);
    }

    @Test
    void getById_shouldCallServiceWithLocale() {
        QuizDto dto =
                new QuizDto(5, "quiz5", "Название", "draft", "ml_riasec", 4, 1, null, 30);

        when(quizService.getByIdLocalized(5, "ru")).thenReturn(dto);

        QuizDto result = controller.getById(5);

        assertThat(result.id()).isEqualTo(5);
        assertThat(result.title()).isEqualTo("Название");

        verify(quizService).getByIdLocalized(5, "ru");
    }

    @Test
    void getByCode_shouldCallServiceWithLocale() {
        QuizDto dto = new QuizDto(15, "Q15", "Тест по коду", "draft", "ml_riasec", 5, 1, null, 30);

        when(quizService.getByCodeLocalized("Q15", "ru")).thenReturn(dto);

        QuizDto result = controller.getByCode("Q15");

        assertThat(result.id()).isEqualTo(15);
        assertThat(result.title()).isEqualTo("Тест по коду");
        verify(quizService).getByCodeLocalized("Q15", "ru");
    }

    @Test
    void getByCode_shouldThrowWhenNotFound() {
        when(quizService.getByCodeLocalized("MISSING", "ru"))
                .thenThrow(new EntityNotFoundException("Quiz not found with code: MISSING"));

        assertThatThrownBy(() -> controller.getByCode("MISSING"))
                .isInstanceOf(EntityNotFoundException.class);

        verify(quizService).getByCodeLocalized("MISSING", "ru");
    }

    @Test
    void create_asAdmin_shouldCreateQuiz() {
        setAdmin();

        CreateQuizRequest req =
                new CreateQuizRequest("QX", "New Quiz", "ml_riasec", 5, 1);

        QuizDto created =
                new QuizDto(100, "QX", "New Quiz", "draft", "ml_riasec", 5, 1, null, 30);

        when(quizService.create(req)).thenReturn(created);

        QuizDto result = controller.create(req);

        assertThat(result.id()).isEqualTo(100);
        verify(quizService).create(req);
    }

    @Test
    void update_asAdmin_shouldUpdateQuiz() {
        setAdmin();

        UpdateQuizRequest req =
                new UpdateQuizRequest("Updated", "ml_riasec", 99);

        QuizDto updated =
                new QuizDto(50, "Q50", "Updated", "draft", "ml_riasec", 99, 10, null, 30);

        when(quizService.update(50, req)).thenReturn(updated);

        QuizDto result = controller.update(50, req);

        assertThat(result.title()).isEqualTo("Updated");
        verify(quizService).update(50, req);
    }

    @Test
    void publish_asAdmin_shouldPublishVersion() {
        setAdmin();

        QuizVersionDto version =
                new QuizVersionDto(5, 10, 2, true, Instant.now());

        when(versionService.publishQuiz(10)).thenReturn(version);

        QuizVersionDto result = controller.publish(10);

        assertThat(result.version()).isEqualTo(2);
        verify(versionService).publishQuiz(10);
    }

    @Test
    void copy_asAdmin_shouldCopyVersion() {
        setAdmin();

        QuizVersionDto version =
                new QuizVersionDto(6, 10, 3, false, null);

        when(versionService.copyLatestVersion(10)).thenReturn(version);

        QuizVersionDto result = controller.copyLatest(10);

        assertThat(result.version()).isEqualTo(3);
        verify(versionService).copyLatestVersion(10);
    }

    @Test
    void searchQuizzes_shouldReturnPageOfDtos() {
        String locale = "ru";
        LocaleContextHolder.setLocale(new Locale(locale));

        QuizDto dto = new QuizDto(1, "Q1", "Тест 1", "draft", "ml", 5, 1, "Описание", 30);
        Pageable pageable = PageRequest.of(0, 10);
        Page<QuizDto> pageResult = new PageImpl<>(List.of(dto), pageable, 1);

        when(quizService.searchAndSort("Тест", "id", locale, pageable)).thenReturn(pageResult);

        Page<QuizDto> result = controller.searchQuizzes("Тест", "id", 1, 10);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).title()).isEqualTo("Тест 1");

        verify(quizService).searchAndSort("Тест", "id", locale, pageable);
    }

    @Test
    void searchQuizzes_emptyResult_shouldReturnEmptyPage() {
        String locale = "en";
        LocaleContextHolder.setLocale(Locale.of(locale));

        Pageable pageable = PageRequest.of(0, 10);
        Page<QuizDto> emptyPage = new PageImpl<>(List.of(), pageable, 0);

        when(quizService.searchAndSort("", "id", locale, pageable)).thenReturn(emptyPage);

        Page<QuizDto> result = controller.searchQuizzes("", "id", 1, 10);

        assertThat(result.getTotalElements()).isEqualTo(0);
        verify(quizService).searchAndSort("", "id", locale, pageable);
    }
}