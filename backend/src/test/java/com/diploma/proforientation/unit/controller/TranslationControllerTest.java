package com.diploma.proforientation.unit.controller;

import com.diploma.proforientation.controller.TranslationController;
import com.diploma.proforientation.dto.TranslationDto;
import com.diploma.proforientation.dto.request.create.CreateTranslationRequest;
import com.diploma.proforientation.dto.request.update.UpdateTranslationRequest;
import com.diploma.proforientation.service.TranslationService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class TranslationControllerTest {

    @Mock
    private TranslationService service;

    @InjectMocks
    private TranslationController controller;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
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
    void create_asAdmin_shouldCallService() {
        setAdmin();

        CreateTranslationRequest req =
                new CreateTranslationRequest("quiz", 1, "title", "en", "Hello");

        TranslationDto dto = new TranslationDto(10, "quiz", 1, "title", "en", "Hello");

        when(service.create(req)).thenReturn(dto);

        TranslationDto result = controller.create(req);

        assertThat(result.id()).isEqualTo(10);
        verify(service).create(req);
    }

    @Test
    void update_asAdmin_shouldUpdateTranslation() {
        setAdmin();

        UpdateTranslationRequest req =
                new UpdateTranslationRequest("Updated text");

        TranslationDto dto =
                new TranslationDto(10, "quiz", 1, "title", "en", "Updated text");

        when(service.update(10, req)).thenReturn(dto);

        TranslationDto result = controller.update(10, req);

        assertThat(result.text()).isEqualTo("Updated text");
        verify(service).update(10, req);
    }

    @Test
    void delete_asAdmin_shouldCallService() {
        setAdmin();
        controller.delete(10);
        verify(service).delete(10);
    }

    @Test
    void search_shouldReturnList() {
        List<TranslationDto> list = List.of(
                new TranslationDto(1, "quiz", 1, "title", "en", "Test")
        );

        when(service.search("quiz", 1, "en")).thenReturn(list);

        var result = controller.search("quiz", 1, "en");

        assertThat(result).hasSize(1);
        verify(service).search("quiz", 1, "en");
    }
}
