package com.diploma.proforientation.controller;

import com.diploma.proforientation.dto.TraitDto;
import com.diploma.proforientation.dto.request.create.CreateTraitRequest;
import com.diploma.proforientation.service.TraitService;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class TraitControllerTest {

    @Mock
    private TraitService service;

    @InjectMocks
    private TraitController controller;

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
    void getAll_shouldCallServiceWithLocale() {
        List<TraitDto> list = List.of(
                new TraitDto(1, "openness", "Открытость", "Описание", null)
        );

        when(service.getAllLocalized("ru")).thenReturn(list);

        List<TraitDto> result = controller.getAll();

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().name()).isEqualTo("Открытость");

        verify(service).getAllLocalized("ru");
    }

    @Test
    void getById_shouldCallServiceWithLocale() {
        TraitDto dto =
                new TraitDto(5, "logic", "Логика", "Описание", "emotion");

        when(service.getByIdLocalized(5, "ru")).thenReturn(dto);

        TraitDto result = controller.getById(5);

        assertThat(result.id()).isEqualTo(5);
        assertThat(result.name()).isEqualTo("Логика");

        verify(service).getByIdLocalized(5, "ru");
    }

    @Test
    void create_asAdmin_shouldCreateTrait() {
        setAdmin();

        CreateTraitRequest req =
                new CreateTraitRequest("TR", "Trait R", "desc", null);

        TraitDto dto = new TraitDto(5, "TR", "Trait R", "desc", null);

        when(service.create(req)).thenReturn(dto);

        TraitDto result = controller.create(req);

        assertThat(result.id()).isEqualTo(5);
        verify(service).create(req);
    }

    @Test
    void update_asAdmin_shouldUpdateTrait() {
        setAdmin();

        CreateTraitRequest req =
                new CreateTraitRequest("TRX", "Trait RX", "new desc", null);

        TraitDto dto = new TraitDto(9, "TRX", "Trait RX", "new desc", null);

        when(service.update(9, req)).thenReturn(dto);

        TraitDto result = controller.update(9, req);

        assertThat(result.name()).isEqualTo("Trait RX");
        verify(service).update(9, req);
    }

    @Test
    void delete_asAdmin_shouldCallService() {
        setAdmin();

        controller.delete(3);

        verify(service).delete(3);
    }
}