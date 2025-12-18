package com.diploma.proforientation.unit.util;

import com.diploma.proforientation.service.UserService;
import com.diploma.proforientation.util.AuthUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class AuthUtilsTest {

    @Mock
    private UserService userService;

    private AuthUtils authUtils;

    private AutoCloseable mocks;

    @BeforeEach
    void setUp() {
        mocks = MockitoAnnotations.openMocks(this);
        authUtils = new AuthUtils(userService);
    }

    @AfterEach
    void tearDown() throws Exception {
        SecurityContextHolder.clearContext();
        mocks.close();
    }


    @Test
    void getAuthenticatedUserId_authenticatedUser_returnsId() {
        String email = "user@example.com";
        Integer userId = 42;

        Authentication auth = new UsernamePasswordAuthenticationToken(
                email,
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_USER")) // mark as authenticated
        );

        SecurityContextHolder.getContext().setAuthentication(auth);

        when(userService.findIdByEmail(email)).thenReturn(Optional.of(userId));

        Integer result = authUtils.getAuthenticatedUserId();

        assertThat(result).isEqualTo(userId);
        verify(userService).findIdByEmail(email);
    }

    @Test
    void getAuthenticatedUserId_authenticatedUser_notFound_returnsNull() {
        String email = "user@example.com";

        Authentication auth = new UsernamePasswordAuthenticationToken(
                email,
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );

        SecurityContextHolder.getContext().setAuthentication(auth);

        when(userService.findIdByEmail(email)).thenReturn(Optional.empty());

        Integer result = authUtils.getAuthenticatedUserId();

        assertThat(result).isNull();
        verify(userService).findIdByEmail(email);
    }

    @Test
    void getAuthenticatedUserId_anonymousUser_returnsNull() {
        Authentication auth = mock(AnonymousAuthenticationToken.class);
        when(auth.isAuthenticated()).thenReturn(true);

        SecurityContextHolder.getContext().setAuthentication(auth);

        Integer result = authUtils.getAuthenticatedUserId();

        assertThat(result).isNull();
        verifyNoInteractions(userService);
    }

    @Test
    void getAuthenticatedUserId_noAuthentication_returnsNull() {
        SecurityContextHolder.clearContext();

        Integer result = authUtils.getAuthenticatedUserId();

        assertThat(result).isNull();
        verifyNoInteractions(userService);
    }

    @Test
    void getAuthenticatedUserId_notAuthenticated_returnsNull() {
        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(false);

        SecurityContextHolder.getContext().setAuthentication(auth);

        Integer result = authUtils.getAuthenticatedUserId();

        assertThat(result).isNull();
        verifyNoInteractions(userService);
    }
}