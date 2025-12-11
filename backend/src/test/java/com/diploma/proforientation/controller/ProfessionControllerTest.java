package com.diploma.proforientation.controller;

import com.diploma.proforientation.dto.ProfessionDto;
import com.diploma.proforientation.dto.request.create.CreateProfessionRequest;
import com.diploma.proforientation.service.ProfessionService;
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

import static org.assertj.core.api.AssertionsForInterfaceTypes.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ProfessionControllerTest {

    @Mock
    private ProfessionService service;

    @InjectMocks
    private ProfessionController controller;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        LocaleContextHolder.setLocale(Locale.of("ru"));
        SecurityContextHolder.clearContext();
    }

    @Test
    void getAll_shouldCallServiceWithLocale() {
        List<ProfessionDto> list = List.of(
                new ProfessionDto(1, "dev", "Разработчик", "Описание", "ML", 3)
        );

        when(service.getAllLocalized("ru")).thenReturn(list);

        List<ProfessionDto> result = controller.getAll();

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().title()).isEqualTo("Разработчик");

        verify(service).getAllLocalized("ru");
    }

    @Test
    void getById_shouldCallServiceWithLocale() {
        ProfessionDto dto =
                new ProfessionDto(5, "doctor", "Доктор", "Описание", null, 1);

        when(service.getByIdLocalized(5, "ru")).thenReturn(dto);

        ProfessionDto result = controller.getById(5);

        assertThat(result.id()).isEqualTo(5);
        assertThat(result.title()).isEqualTo("Доктор");

        verify(service).getByIdLocalized(5, "ru");
    }

    @Test
    void testCreate_AsAdmin() {

        setAdminAuth();

        CreateProfessionRequest req = new CreateProfessionRequest(
                "DEV", "Developer", "Writes code", "ML1", 3
        );

        ProfessionDto expected = new ProfessionDto(
                50, "DEV", "Developer", "Writes code", "ML1", 3
        );

        when(service.create(req)).thenReturn(expected);

        ProfessionDto result = controller.create(req);

        assertEquals(50, result.id());
        verify(service).create(req);
    }

    @Test
    void testCreate_UnauthorizedUser() {

        setUserAuth();

        CreateProfessionRequest req = new CreateProfessionRequest(
                "DEV", "Developer", "Writes code", "ML1", 3
        );

        when(service.create(req)).thenThrow(new SecurityException("Access denied"));

        assertThrows(SecurityException.class, () -> controller.create(req));
    }

    @Test
    void testUpdate_AsAdmin() {

        setAdminAuth();

        CreateProfessionRequest req = new CreateProfessionRequest(
                "DEV2", "New Title", "New Desc", "ML99", 3
        );

        ProfessionDto updated = new ProfessionDto(
                10, "DEV2", "New Title", "New Desc", "ML99", 3
        );

        when(service.update(10, req)).thenReturn(updated);

        ProfessionDto result = controller.update(10, req);

        assertEquals("DEV2", result.code());
        verify(service).update(10, req);
    }

    @Test
    void testUpdate_UnauthorizedUser() {

        setUserAuth();

        CreateProfessionRequest req = new CreateProfessionRequest(
                "DEV2", "New Title", "New Desc", "ML99", 3
        );

        when(service.update(10, req)).thenThrow(new SecurityException("Access denied"));

        assertThrows(SecurityException.class, () -> controller.update(10, req));
    }

    @Test
    void testDelete_AsAdmin() {

        setAdminAuth();

        controller.delete(7);

        verify(service).delete(7);
    }

    @Test
    void testDelete_UnauthorizedUser() {

        setUserAuth();

        doThrow(new SecurityException("Access denied"))
                .when(service).delete(7);

        assertThrows(SecurityException.class, () -> controller.delete(7));
    }

    private void setAdminAuth() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "admin",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                )
        );
    }

    private void setUserAuth() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "user",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_USER"))
                )
        );
    }
}
