package com.diploma.proforientation.unit.controller;

import com.diploma.proforientation.controller.QuestionController;
import com.diploma.proforientation.dto.OptionDto;
import com.diploma.proforientation.dto.QuestionDto;
import com.diploma.proforientation.dto.request.create.CreateQuestionRequest;
import com.diploma.proforientation.dto.request.update.UpdateQuestionRequest;
import com.diploma.proforientation.service.QuestionService;
import org.junit.jupiter.api.AfterEach;
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

import java.util.List;
import java.util.Locale;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class QuestionControllerTest {

    @Mock
    private QuestionService service;

    @InjectMocks
    private QuestionController controller;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void cleanup() {
        LocaleContextHolder.resetLocaleContext();
    }

    private void setAdmin() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "admin", null,
                        java.util.List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                )
        );
    }

    @Test
    void create_asAdmin_shouldWork() {
        setAdmin();

        CreateQuestionRequest req = new CreateQuestionRequest(1, 1, "single_choice", "Test Q");

        QuestionDto dto = new QuestionDto(10, 1, 1, "single_choice", "Test Q", null);

        when(service.create(req)).thenReturn(dto);

        QuestionDto result = controller.create(req);

        assertThat(result.id()).isEqualTo(10);
        verify(service).create(req);
    }

    @Test
    void update_asAdmin_shouldWork() {
        setAdmin();

        UpdateQuestionRequest req = new UpdateQuestionRequest(2, "multiple_choice", "Updated");
        QuestionDto dto = new QuestionDto(5, 1, 2, "multiple_choice", "Updated", null);

        when(service.update(5, req)).thenReturn(dto);

        QuestionDto result = controller.update(5, req);

        assertThat(result.ord()).isEqualTo(2);
        verify(service).update(5, req);
    }

    @Test
    void delete_asAdmin_shouldDelegate() {
        setAdmin();
        controller.delete(7);
        verify(service).delete(7);
    }

    @Test
    void getQuestionsForQuiz_shouldReturnPaginatedQuestions() {
        int quizId = 5;
        int page = 1;
        int size = 10;
        String sort = "id";

        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(sort));

        QuestionDto dto = new QuestionDto(
                1, 1, 1, "single_choice", "Question", null
        );

        Page<QuestionDto> pageResult =
                new PageImpl<>(List.of(dto), pageable, 1);

        when(service.getQuestionsForCurrentVersion(quizId, pageable))
                .thenReturn(pageResult);

        Page<QuestionDto> result =
                controller.getQuestionsForQuiz(quizId, page, size, sort);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().getFirst().text()).isEqualTo("Question");

        verify(service).getQuestionsForCurrentVersion(quizId, pageable);
    }

    @Test
    void getQuestionsForQuizVersion_shouldReturnPaginatedQuestions() {
        int quizId = 3;
        int version = 2;
        int page = 1;
        int size = 5;
        String sort = "id";

        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(sort));

        QuestionDto dto = new QuestionDto(
                10, 1, 2, "multiple_choice", "Versioned question", null
        );

        Page<QuestionDto> pageResult = new PageImpl<>(List.of(dto), pageable, 1);

        when(service.getQuestionsForVersion(quizId, version, pageable))
                .thenReturn(pageResult);

        Page<QuestionDto> result = controller.getQuestionsForQuizVersion(
                quizId, version, page, size, sort
        );

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().getFirst().qtype()).isEqualTo("multiple_choice");

        verify(service).getQuestionsForVersion(quizId, version, pageable);
    }

    @Test
    void getOptionsForQuestion_shouldUseLocaleFromContext() {

        LocaleContextHolder.setLocale(Locale.ENGLISH);

        Map<Integer, Double> weights = Map.of(
                1, 2.0,
                2, 1.0
        );

        OptionDto option = new OptionDto(
                100,
                15,
                1,
                "Localized option",
                weights
        );

        when(service.getOptionsForQuestionLocalized(15))
                .thenReturn(List.of(option));

        List<OptionDto> result = controller.getOptionsForQuestion(15);

        assertThat(result).hasSize(1);
        OptionDto dto = result.getFirst();

        assertThat(dto.label()).isEqualTo("Localized option");
        assertThat(dto.weightsByTraitId()).containsEntry(1, 2.0);
        assertThat(dto.weightsByTraitId()).containsEntry(2, 1.0);

        verify(service).getOptionsForQuestionLocalized(15);
    }
}