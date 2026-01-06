package com.diploma.proforientation.unit.controller;

import com.diploma.proforientation.controller.ProfessionController;
import com.diploma.proforientation.dto.ProfessionDto;
import com.diploma.proforientation.dto.request.create.CreateProfessionRequest;
import com.diploma.proforientation.service.ProfessionService;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ProfessionControllerTest {

    @Mock
    private ProfessionService service;

    @InjectMocks
    private ProfessionController controller;

    private ProfessionDto dto1;
    private ProfessionDto dto2;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        LocaleContextHolder.setLocale(Locale.ENGLISH);

        dto1 = new ProfessionDto(
                1,
                "DEV",
                "Developer",
                "Writes code",
                "ML_DEV",
                10
        );

        dto2 = new ProfessionDto(
                2,
                "DOC",
                "Doctor",
                "Treats people",
                "ML_DOC",
                11
        );
    }

    @Test
    void shouldReturnPaginatedLocalizedProfessions() {
        LocaleContextHolder.setLocale(Locale.ENGLISH);

        int page = 1;
        int size = 20;
        String sort = "id";

        Pageable pageable = PageRequest.of(0, size, Sort.by(sort));

        Page<ProfessionDto> pageResult =
                new PageImpl<>(List.of(dto1, dto2), pageable, 2);

        when(service.getAllLocalized(pageable)).thenReturn(pageResult);

        Page<ProfessionDto> result = controller.getAll(page, size, sort);

        assertNotNull(result);
        assertEquals(2, result.getContent().size());
        assertEquals("Developer", result.getContent().getFirst().title());

        verify(service, times(1)).getAllLocalized(pageable);
    }

    @Test
    void shouldReturnProfessionByIdLocalized() {
        when(service.getByIdLocalized(1)).thenReturn(dto1);

        ProfessionDto result = controller.getById(1);

        assertNotNull(result);
        assertEquals("DEV", result.code());

        verify(service).getByIdLocalized(1);
    }

    @Test
    void shouldCreateProfessionForAdmin() {
        CreateProfessionRequest req = new CreateProfessionRequest(
                "DEV",
                "Developer",
                "Writes code",
                "ML_DEV",
                10
        );

        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(
                        "admin",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                );
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(service.create(req)).thenReturn(dto1);

        ProfessionDto result = controller.create(req);

        assertNotNull(result);
        assertEquals("DEV", result.code());

        verify(service).create(req);
    }

    @Test
    void shouldUpdateProfessionForAdmin() {
        CreateProfessionRequest req = new CreateProfessionRequest(
                "DEV2",
                "Senior Developer",
                "Writes better code",
                "ML_DEV2",
                10
        );

        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(
                        "admin",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                );
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(service.update(1, req)).thenReturn(dto1);

        ProfessionDto result = controller.update(1, req);

        assertNotNull(result);
        assertEquals("DEV", result.code());

        verify(service).update(1, req);
    }

    @Test
    void shouldDeleteProfessionForAdmin() {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(
                        "admin",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                );
        SecurityContextHolder.getContext().setAuthentication(auth);

        doNothing().when(service).delete(1);

        controller.delete(1);

        verify(service).delete(1);
    }
}