package com.diploma.proforientation.controller;

import com.diploma.proforientation.model.User;
import com.diploma.proforientation.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UserControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    private User user;
    private User admin;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);

        user = new User();
        user.setEmail("user@example.com");
        user.setDisplayName("User");

        admin = new User();
        admin.setEmail("admin@example.com");
        admin.setDisplayName("Admin");
    }

    @Test
    void shouldReturnAuthenticatedUser() {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(
                        user,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_USER"))
                );

        SecurityContextHolder.getContext().setAuthentication(auth);

        ResponseEntity<User> response = userController.authenticatedUser();

        assertEquals(200, response.getStatusCode().value());
        assertEquals(user, response.getBody());
    }

    @Test
    void shouldReturnUsersForAdminWithPagination() {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(
                        admin,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                );

        SecurityContextHolder.getContext().setAuthentication(auth);

        Pageable pageable = PageRequest.of(0, 20);
        List<User> users = List.of(user, admin);
        Page<User> page = new PageImpl<>(users, pageable, users.size());

        when(userService.getAllUsers(pageable)).thenReturn(page);

        ResponseEntity<Page<User>> response = userController.allUsers(pageable);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(2, response.getBody().getContent().size());

        verify(userService, times(1)).getAllUsers(pageable);
    }
}