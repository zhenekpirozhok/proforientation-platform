package com.diploma.proforientation.unit.service;

import com.diploma.proforientation.model.User;
import com.diploma.proforientation.model.enumeration.UserRole;
import com.diploma.proforientation.repository.UserRepository;
import com.diploma.proforientation.service.impl.UserServiceImpl;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.AssertionsForClassTypes.assertThatThrownBy;
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
        SecurityContextHolder.clearContext();
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

    @Test
    void changeUserRole_shouldUpdateRole_whenDifferentUser() {
        user1.setId(1);
        user1.setRole(UserRole.USER);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "admin@example.com",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                )
        );

        when(userRepository.findById(1)).thenReturn(Optional.of(user1));

        userService.changeUserRole(1, UserRole.ADMIN);

        assertEquals(UserRole.ADMIN, user1.getRole());
        verify(userRepository).findById(1);

        verify(userRepository, atMostOnce()).save(any(User.class));
        verifyNoMoreInteractions(userRepository);
    }

    @Test
    void changeUserRole_shouldThrow_whenChangingOwnRole() {
        user1.setId(1);
        user1.setEmail("me@example.com");
        user1.setRole(UserRole.USER);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "me@example.com",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                )
        );

        when(userRepository.findById(1)).thenReturn(Optional.of(user1));

        assertThatThrownBy(() -> userService.changeUserRole(1, UserRole.ADMIN))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot change your own role");

        assertEquals(UserRole.USER, user1.getRole());

        verify(userRepository).findById(1);
        verify(userRepository, never()).save(any());
        verifyNoMoreInteractions(userRepository);
    }

    @Test
    void changeUserRole_shouldThrow_whenUserNotFound() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "admin@example.com",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                )
        );

        when(userRepository.findById(999)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.changeUserRole(999, UserRole.ADMIN))
                .isInstanceOf(EntityNotFoundException.class);

        verify(userRepository).findById(999);
        verify(userRepository, never()).save(any());
        verifyNoMoreInteractions(userRepository);
    }
}