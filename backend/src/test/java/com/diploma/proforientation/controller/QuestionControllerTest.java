package com.diploma.proforientation.controller;

import com.diploma.proforientation.dto.QuestionDto;
import com.diploma.proforientation.dto.request.create.CreateQuestionRequest;
import com.diploma.proforientation.dto.request.update.UpdateQuestionRequest;
import com.diploma.proforientation.service.QuestionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

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
        Pageable pageable = PageRequest.of(0, 10);

        QuestionDto dto = new QuestionDto(
                1, 1, 1, "single_choice", "Question", null
        );

        Page<QuestionDto> page =
                new PageImpl<>(java.util.List.of(dto), pageable, 1);

        when(service.getQuestionsForCurrentVersion(5, "en", pageable))
                .thenReturn(page);

        Page<QuestionDto> result =
                controller.getQuestionsForQuiz(5, "en", pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().getFirst().text()).isEqualTo("Question");

        verify(service).getQuestionsForCurrentVersion(5, "en", pageable);
    }

    @Test
    void getQuestionsForQuizVersion_shouldReturnPaginatedQuestions() {
        Pageable pageable = PageRequest.of(0, 5);

        QuestionDto dto = new QuestionDto(
                10, 1, 2, "multi_choice", "Versioned question", null
        );

        Page<QuestionDto> page =
                new PageImpl<>(java.util.List.of(dto), pageable, 1);

        when(service.getQuestionsForVersion(3, 2, "ru", pageable))
                .thenReturn(page);

        Page<QuestionDto> result =
                controller.getQuestionsForQuizVersion(3, 2, "ru", pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().getFirst().qtype()).isEqualTo("multi_choice");

        verify(service).getQuestionsForVersion(3, 2, "ru", pageable);
    }

}