package com.diploma.proforientation.service;

import com.diploma.proforientation.model.User;
import com.diploma.proforientation.repository.UserRepository;
import com.diploma.proforientation.service.impl.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserServiceImpl userService;

    private User user1;
    private User user2;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        user1 = new User();
        user1.setEmail("user1@example.com");
        user1.setDisplayName("User 1");

        user2 = new User();
        user2.setEmail("user2@example.com");
        user2.setDisplayName("User 2");
    }

    @Test
    void shouldReturnUsersWithPagination() {
        Pageable pageable = PageRequest.of(0, 10);
        List<User> users = List.of(user1, user2);
        Page<User> page = new PageImpl<>(users, pageable, users.size());

        when(userRepository.findAll(pageable)).thenReturn(page);

        Page<User> result = userService.getAllUsers(pageable);

        assertNotNull(result);
        assertEquals(2, result.getContent().size());
        assertEquals("user1@example.com", result.getContent().getFirst().getEmail());

        verify(userRepository, times(1)).findAll(pageable);
        verifyNoMoreInteractions(userRepository);
    }

    @Test
    void shouldReturnEmptyPageWhenNoUsersFound() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<User> emptyPage = Page.empty(pageable);

        when(userRepository.findAll(pageable)).thenReturn(emptyPage);

        Page<User> result = userService.getAllUsers(pageable);

        assertNotNull(result);
        assertTrue(result.isEmpty());
        assertEquals(0, result.getTotalElements());

        verify(userRepository, times(1)).findAll(pageable);
        verifyNoMoreInteractions(userRepository);
    }
}