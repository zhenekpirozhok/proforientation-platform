package com.diploma.proforientation.controller;

import com.diploma.proforientation.model.User;
import com.diploma.proforientation.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
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

    private User mockUser;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);

        mockUser = new User();
        mockUser.setEmail("user@example.com");
        mockUser.setDisplayName("Test User");
    }

    @Test
    void testAuthenticatedUser() {
        // Prepare authentication object with principal
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(
                        mockUser,
                        null,
                        List.of(new SimpleGrantedAuthority("USER"))
                );

        SecurityContextHolder.getContext().setAuthentication(auth);

        ResponseEntity<User> response = userController.authenticatedUser();

        assertEquals(200, response.getStatusCode().value());
        assertEquals(mockUser, response.getBody());
    }

    @Test
    void testAllUsers() {
        List<User> userList = List.of(mockUser);

        when(userService.getAllUsers()).thenReturn(userList);

        ResponseEntity<List<User>> response = userController.allUsers();

        assertEquals(200, response.getStatusCode().value());
        assertEquals(userList, response.getBody());
    }
}