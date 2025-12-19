package com.diploma.proforientation.unit.controller;

import com.diploma.proforientation.controller.UserController;
import com.diploma.proforientation.dto.UserDto;
import com.diploma.proforientation.model.User;
import com.diploma.proforientation.model.enumeration.UserRole;
import com.diploma.proforientation.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
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
        user.setId(1);
        user.setEmail("user@example.com");
        user.setDisplayName("User");
        user.setRole(UserRole.USER);

        admin = new User();
        admin.setId(2);
        admin.setEmail("admin@example.com");
        admin.setDisplayName("Admin");
        admin.setRole(UserRole.ADMIN);
    }

    @Test
    void shouldReturnAuthenticatedUserAsDto() {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(
                        user,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_USER"))
                );

        SecurityContextHolder.getContext().setAuthentication(auth);

        ResponseEntity<UserDto> response = userController.authenticatedUser();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();

        UserDto dto = response.getBody();

        assertThat(dto.id()).isEqualTo(1);
        assertThat(dto.email()).isEqualTo("user@example.com");
        assertThat(dto.displayName()).isEqualTo("User");
        assertThat(dto.role()).isEqualTo("USER");
    }

    @Test
    void shouldReturnUsersForAdminWithPaginationAsDto() {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(
                        admin,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                );
        SecurityContextHolder.getContext().setAuthentication(auth);

        int page = 1; // controller param (1-based)
        int size = 20;
        String sort = "id";

        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(sort));
        Page<User> userPage = new PageImpl<>(List.of(user, admin), pageable, 2);

        when(userService.getAllUsers(pageable)).thenReturn(userPage);

        ResponseEntity<Page<UserDto>> response = userController.allUsers(page, size, sort);

        assertThat(response.getStatusCodeValue()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getContent()).hasSize(2);

        UserDto first = response.getBody().getContent().get(0);
        assertThat(first.email()).isEqualTo("user@example.com");

        verify(userService, times(1)).getAllUsers(pageable);
    }
}