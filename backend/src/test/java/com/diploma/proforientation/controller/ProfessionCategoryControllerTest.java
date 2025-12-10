package com.diploma.proforientation.controller;

import com.diploma.proforientation.dto.ProfessionCategoryDto;
import com.diploma.proforientation.dto.request.create.CreateCategoryRequest;
import com.diploma.proforientation.service.ProfessionCategoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ProfessionCategoryControllerTest {

    @Mock
    private ProfessionCategoryService service;

    @InjectMocks
    private ProfessionCategoryController controller;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        SecurityContextHolder.clearContext();
    }

    @Test
    void testGetAll() {
        List<ProfessionCategoryDto> mockList = List.of(
                new ProfessionCategoryDto(1, "IT", "Tech", "#000000"),
                new ProfessionCategoryDto(2, "MED", "Medicine", "#FFFFFF")
        );

        when(service.getAll()).thenReturn(mockList);

        List<ProfessionCategoryDto> result = controller.getAll();

        assertEquals(2, result.size());
        assertEquals("IT", result.getFirst().code());
        verify(service).getAll();
    }

    @Test
    void testCreate_AsAdmin() {

        // Mock security context as ADMIN
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(
                        "admin",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                );
        SecurityContextHolder.getContext().setAuthentication(auth);

        CreateCategoryRequest req = new CreateCategoryRequest("IT", "Tech", "#000000");
        ProfessionCategoryDto saved = new ProfessionCategoryDto(10, "IT", "Tech", "#000000");

        when(service.create(req)).thenReturn(saved);

        ProfessionCategoryDto result = controller.create(req);

        assertEquals(10, result.id());
        assertEquals("IT", result.code());
        verify(service).create(req);
    }

    @Test
    void testCreate_UnauthorizedUser() {

        // User without ADMIN role
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(
                        "user",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_USER"))
                );
        SecurityContextHolder.getContext().setAuthentication(auth);

        CreateCategoryRequest req = new CreateCategoryRequest("IT", "Tech", "#000000");

        when(service.create(req)).thenThrow(new SecurityException("Access denied"));

        assertThrows(SecurityException.class, () -> controller.create(req));
    }

    @Test
    void testUpdate_AsAdmin() {

        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(
                        "admin",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                );
        SecurityContextHolder.getContext().setAuthentication(auth);

        CreateCategoryRequest req = new CreateCategoryRequest("IT2", "NewName", "#123456");
        ProfessionCategoryDto updated = new ProfessionCategoryDto(1, "IT2", "NewName", "#123456");

        when(service.update(1, req)).thenReturn(updated);

        ProfessionCategoryDto result = controller.update(1, req);

        assertEquals("IT2", result.code());
        verify(service).update(1, req);
    }

    @Test
    void testDelete_AsAdmin() {

        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(
                        "admin",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                );
        SecurityContextHolder.getContext().setAuthentication(auth);

        controller.delete(5);

        verify(service).delete(5);
    }
}