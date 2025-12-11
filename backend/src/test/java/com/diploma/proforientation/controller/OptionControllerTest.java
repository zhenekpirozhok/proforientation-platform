package com.diploma.proforientation.controller;

import com.diploma.proforientation.dto.OptionDto;
import com.diploma.proforientation.dto.request.create.CreateOptionRequest;
import com.diploma.proforientation.dto.request.update.UpdateOptionRequest;
import com.diploma.proforientation.service.OptionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Locale;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class OptionControllerTest {

    @Mock
    private OptionService service;

    @InjectMocks
    private OptionController controller;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        LocaleContextHolder.setLocale(Locale.of("ru"));
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

        CreateOptionRequest req = new CreateOptionRequest(1, 1, "Yes");
        OptionDto dto = new OptionDto(10, 1, 1, "Yes");

        when(service.create(req)).thenReturn(dto);

        OptionDto result = controller.create(req);

        assertThat(result.id()).isEqualTo(10);
        verify(service).create(req);
    }

    @Test
    void update_asAdmin_shouldWork() {
        setAdmin();

        UpdateOptionRequest req = new UpdateOptionRequest(2, "Updated");
        OptionDto dto = new OptionDto(5, 1, 2, "Updated");

        when(service.update(5, req)).thenReturn(dto);

        OptionDto result = controller.update(5, req);

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
    void getByQuestion_shouldPassLocalizedCallToService() {
        List<OptionDto> expected = List.of(
                new OptionDto(10, 5, 1, "Лейбл")
        );

        when(service.getByQuestionLocalized(5, "ru"))
                .thenReturn(expected);

        List<OptionDto> result = controller.getByQuestion(5);

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().label()).isEqualTo("Лейбл");

        verify(service).getByQuestionLocalized(5, "ru");
    }
}