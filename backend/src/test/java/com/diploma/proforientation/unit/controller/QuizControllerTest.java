package com.diploma.proforientation.unit.controller;

import com.diploma.proforientation.controller.QuizController;
import com.diploma.proforientation.dto.QuizDto;
import com.diploma.proforientation.dto.QuizVersionDto;
import com.diploma.proforientation.dto.TraitDto;
import com.diploma.proforientation.dto.request.create.CreateQuizRequest;
import com.diploma.proforientation.dto.request.update.UpdateQuizRequest;
import com.diploma.proforientation.model.User;
import com.diploma.proforientation.service.QuizService;
import com.diploma.proforientation.service.QuizVersionService;
import com.diploma.proforientation.service.TraitService;
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

    @Mock
    private TraitService traitService;

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

        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(sort));

        QuizDto dto = new QuizDto(1, "quiz1", "Тест 1", "published", "ml", 3, 2, null, 30);
        Page<QuizDto> pageResult = new PageImpl<>(List.of(dto), pageable, 1);

        when(quizService.getAllLocalized(pageable)).thenReturn(pageResult);

        Page<QuizDto> result = controller.getAll(page, size, sort);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().getFirst().title()).isEqualTo("Тест 1");

        verify(quizService).getAllLocalized(pageable);
    }

    @Test
    void getById_shouldCallServiceWithLocale() {
        QuizDto dto =
                new QuizDto(5, "quiz5", "Название", "draft", "ml_riasec", 4, 1, null, 30);

        when(quizService.getByIdLocalized(5)).thenReturn(dto);

        QuizDto result = controller.getById(5);

        assertThat(result.id()).isEqualTo(5);
        assertThat(result.title()).isEqualTo("Название");

        verify(quizService).getByIdLocalized(5);
    }

    @Test
    void getByCode_shouldCallServiceWithLocale() {
        QuizDto dto = new QuizDto(15, "Q15", "Тест по коду", "draft", "ml_riasec", 5, 1, null, 30);

        when(quizService.getByCodeLocalized("Q15")).thenReturn(dto);

        QuizDto result = controller.getByCode("Q15");

        assertThat(result.id()).isEqualTo(15);
        assertThat(result.title()).isEqualTo("Тест по коду");
        verify(quizService).getByCodeLocalized("Q15");
    }

    @Test
    void getByCode_shouldThrowWhenNotFound() {
        when(quizService.getByCodeLocalized("MISSING"))
                .thenThrow(new EntityNotFoundException("Quiz not found with code: MISSING"));

        assertThatThrownBy(() -> controller.getByCode("MISSING"))
                .isInstanceOf(EntityNotFoundException.class);

        verify(quizService).getByCodeLocalized("MISSING");
    }

    @Test
    void create_shouldCallServiceWithPrincipal() {
        User user = new User();
        user.setId(1);
        user.setEmail("admin@example.com");

        CreateQuizRequest req = new CreateQuizRequest(
                "QX", "New Quiz", null, null, 30
        );

        QuizDto created = new QuizDto(100, "QX", "New Quiz", "DRAFT", "ML_RIASEC", null, 1, null, 30);
        when(quizService.create(req, 1)).thenReturn(created);

        QuizDto result = controller.create(req, user);

        assertThat(result.id()).isEqualTo(100);
        verify(quizService).create(req, 1);
    }

    @Test
    void update_asAdmin_shouldUpdateQuiz() {
        setAdmin();

        UpdateQuizRequest req =
                new UpdateQuizRequest("Updated", "ml_riasec", null, null, 30, 99);

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
    void search_shouldReturnPageOfDtos_withCustomPagination() {
        Integer categoryId = 5;
        Integer minDurationSec = 300;
        Integer maxDurationSec = 900;

        int page = 2;
        int size = 10;
        String sort = "id";

        Pageable expectedPageable = PageRequest.of(page - 1, size, Sort.by(sort));

        QuizDto dto = new QuizDto(
                1, "Q1", "Тест 1", "DRAFT", "ML",
                5, 1, "Описание", 30
        );

        Page<QuizDto> pageResult = new PageImpl<>(List.of(dto), expectedPageable, 1);

        when(quizService.search("Тест", categoryId, minDurationSec, maxDurationSec, expectedPageable))
                .thenReturn(pageResult);

        Page<QuizDto> result = controller.search(
                "Тест",
                categoryId,
                minDurationSec,
                maxDurationSec,
                page,
                size,
                sort
        );

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().getFirst().title()).isEqualTo("Тест 1");

        verify(quizService).search("Тест", categoryId, minDurationSec, maxDurationSec, expectedPageable);
        verifyNoMoreInteractions(quizService);
    }

    @Test
    void search_emptyResult_shouldReturnEmptyPage_withDefaults() {
        int page = 1;
        int size = 20;
        String sort = "id";

        Pageable expectedPageable = PageRequest.of(page - 1, size, Sort.by(sort));
        Page<QuizDto> emptyPage = new PageImpl<>(List.of(), expectedPageable, 0);

        when(quizService.search("", null, null, null, expectedPageable))
                .thenReturn(emptyPage);

        Page<QuizDto> result = controller.search(
                "",
                null,
                null,
                null,
                page,
                size,
                sort
        );

        assertThat(result.getTotalElements()).isZero();
        assertThat(result.getContent()).isEmpty();

        verify(quizService).search("", null, null, null, expectedPageable);
        verifyNoMoreInteractions(quizService);
    }

    @Test
    void delete_asAdmin_shouldCallService() {
        setAdmin();

        doNothing().when(quizService).delete(50);

        controller.delete(50);

        verify(quizService).delete(50);
    }

    @Test
    void getVersions_shouldReturnList() {
        QuizVersionDto v1 = new QuizVersionDto(1, 10, 2, true, Instant.now());
        QuizVersionDto v2 = new QuizVersionDto(2, 10, 1, false, null);

        when(versionService.getVersionsForQuiz(10))
                .thenReturn(List.of(v1, v2));

        List<QuizVersionDto> result = controller.getVersions(10);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).version()).isEqualTo(2);
        assertThat(result.get(1).version()).isEqualTo(1);

        verify(versionService).getVersionsForQuiz(10);
    }

    @Test
    void getCurrentVersion_shouldReturnCurrent() {
        QuizVersionDto current =
                new QuizVersionDto(3, 10, 5, true, Instant.now());

        when(versionService.getCurrentVersion(10))
                .thenReturn(current);

        QuizVersionDto result = controller.getCurrentVersion(10);

        assertThat(result.version()).isEqualTo(5);
        assertThat(result.isCurrent()).isTrue();

        verify(versionService).getCurrentVersion(10);
    }

    @Test
    void getCurrentVersion_shouldFailIfMissing() {
        when(versionService.getCurrentVersion(10))
                .thenThrow(new RuntimeException("Current version not found"));

        assertThatThrownBy(() -> controller.getCurrentVersion(10))
                .isInstanceOf(RuntimeException.class);

        verify(versionService).getCurrentVersion(10);
    }

    @Test
    void getVersion_shouldReturnSpecificVersion() {
        QuizVersionDto version =
                new QuizVersionDto(4, 10, 3, false, Instant.now());

        when(versionService.getVersion(10, 3))
                .thenReturn(version);

        QuizVersionDto result = controller.getVersion(10, 3);

        assertThat(result.version()).isEqualTo(3);
        verify(versionService).getVersion(10, 3);
    }

    @Test
    void getVersion_shouldFailIfNotFound() {
        when(versionService.getVersion(10, 99))
                .thenThrow(new RuntimeException("Version not found"));

        assertThatThrownBy(() -> controller.getVersion(10, 99))
                .isInstanceOf(RuntimeException.class);

        verify(versionService).getVersion(10, 99);
    }

    @Test
    void createVersion_asAdmin_shouldCreateDraftVersion() {
        setAdmin();

        QuizVersionDto draft =
                new QuizVersionDto(7, 10, 4, false, null);

        when(versionService.createDraftVersion(10))
                .thenReturn(draft);

        QuizVersionDto result = controller.createVersion(10);

        assertThat(result.version()).isEqualTo(4);
        assertThat(result.isCurrent()).isFalse();
        assertThat(result.publishedAt()).isNull();

        verify(versionService).createDraftVersion(10);
    }

    @Test
    void getTraits_shouldReturnListFromService() {
        TraitDto t1 = new TraitDto(1, "realistic", "Realistic", "desc1", null);
        TraitDto t2 = new TraitDto(2, "analytical", "Analytical", "desc2", "realistic");

        when(traitService.getTraitsForQuizVersion(10)).thenReturn(List.of(t1, t2));

        List<TraitDto> result = controller.getTraits(10);

        assertThat(result).hasSize(2);
        assertThat(result.get(1).bipolarPairCode()).isEqualTo("realistic");
        verify(traitService).getTraitsForQuizVersion(10);
    }
}