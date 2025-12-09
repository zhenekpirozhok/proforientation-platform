package com.diploma.proforientation.service;

import com.diploma.proforientation.model.User;
import com.diploma.proforientation.model.role.UserRole;
import com.diploma.proforientation.repository.UserRepository;
import com.diploma.proforientation.service.impl.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UserServiceTest {

    private UserRepository userRepository;
    private UserServiceImpl userService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        userService = new UserServiceImpl(userRepository);
    }

    @Test
    void testGetAllUsersReturnsList() {
        User u1 = new User("a@example.com", "p1", "A", UserRole.USER);
        User u2 = new User("b@example.com", "p2", "B", UserRole.ADMIN);
        List<User> repoUsers = List.of(u1, u2);

        when(userRepository.findAll()).thenReturn(repoUsers);

        List<User> result = userService.getAllUsers();

        assertEquals(2, result.size());
        assertEquals("a@example.com", result.get(0).getEmail());
        assertEquals("b@example.com", result.get(1).getEmail());
        verify(userRepository, times(1)).findAll();
    }

    @Test
    void testGetAllUsersEmptyList() {
        when(userRepository.findAll()).thenReturn(new ArrayList<>());

        List<User> result = userService.getAllUsers();

        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(userRepository, times(1)).findAll();
    }
}