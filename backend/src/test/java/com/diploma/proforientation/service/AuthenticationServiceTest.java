package com.diploma.proforientation.service;

import com.diploma.proforientation.dto.LoginUserDto;
import com.diploma.proforientation.dto.RegisterUserDto;
import com.diploma.proforientation.exception.EmailNotFoundException;
import com.diploma.proforientation.exception.UserNotFoundForPasswordResetException;
import com.diploma.proforientation.model.PasswordResetToken;
import com.diploma.proforientation.model.User;
import com.diploma.proforientation.model.enumeration.UserRole;
import com.diploma.proforientation.repository.PasswordResetTokenRepository;
import com.diploma.proforientation.repository.UserRepository;
import com.diploma.proforientation.service.impl.AuthenticationServiceImpl;
import com.diploma.proforientation.service.impl.EmailServiceImpl;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AuthenticationServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private PasswordResetTokenRepository tokenRepo;

    @Mock
    private EmailServiceImpl emailService;

    @Mock
    private GoogleIdTokenVerifier googleIdTokenVerifier;

    @InjectMocks
    private AuthenticationServiceImpl authService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        String googleClientId = "test-google-client-id";
        authService = new AuthenticationServiceImpl(
                googleClientId,
                userRepository,
                passwordEncoder,
                authenticationManager,
                tokenRepo,
                emailService,
                googleIdTokenVerifier
        );
    }

    @Test
    void signup_shouldEncodePasswordAndSaveUser() {

        RegisterUserDto dto = new RegisterUserDto();
        dto.setEmail("test@example.com");
        dto.setDisplayName("Test User");
        dto.setPassword("plainpassword");

        when(passwordEncoder.encode("plainpassword")).thenReturn("encodedPassword");

        User savedUser = new User("test@example.com", "encodedPassword", "Test User", UserRole.USER);

        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        User result = authService.signup(dto);

        assertEquals("test@example.com", result.getEmail());
        assertEquals("Test User", result.getDisplayName());
        assertEquals("encodedPassword", result.getPasswordHash());

        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void authenticate_shouldReturnUserWhenSuccess() {
        LoginUserDto dto = new LoginUserDto();
        dto.setEmail("test@example.com");
        dto.setPassword("password");

        User user = new User();
        user.setEmail(dto.getEmail());

        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(user);

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);

        User result = authService.authenticate(dto);

        assertEquals(user, result);
        verify(authenticationManager).authenticate(any());
    }

    @Test
    void authenticate_shouldThrowBadCredentialsExceptionOnFailure() {
        LoginUserDto dto = new LoginUserDto();
        dto.setEmail("test@example.com");
        dto.setPassword("password");

        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn("not a user");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);

        assertThatThrownBy(() -> authService.authenticate(dto))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid email or password");
    }

    @Test
    void sendResetPasswordToken_shouldSaveTokenAndSendEmail() {
        String email = "test@example.com";
        User user = new User();
        user.setEmail(email);

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

        ArgumentCaptor<PasswordResetToken> tokenCaptor = ArgumentCaptor.forClass(PasswordResetToken.class);

        when(tokenRepo.save(any(PasswordResetToken.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        doNothing().when(emailService).sendResetPasswordEmail(eq(email), anyString());

        authService.sendResetToken(email);

        verify(tokenRepo).save(tokenCaptor.capture());
        PasswordResetToken savedToken = tokenCaptor.getValue();

        assertEquals(user, savedToken.getUser());
        assertNotNull(savedToken.getToken());
        assertTrue(savedToken.getExpiryDate().isAfter(LocalDateTime.now()));

        verify(emailService).sendResetPasswordEmail(email, savedToken.getToken());
    }

    @Test
    void sendResetPasswordToken_shouldThrowIfEmailNotFound() {
        String email = "missing@example.com";

        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.sendResetToken(email))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Email not found");
    }

    @Test
    void resetPassword_shouldUpdateUserPasswordAndDeleteToken() {
        String token = UUID.randomUUID().toString();
        String newPassword = "newPassword";

        User user = new User();
        user.setEmail("test@example.com");

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUser(user);
        resetToken.setExpiryDate(LocalDateTime.now().plusMinutes(5));

        when(tokenRepo.findByToken(token)).thenReturn(Optional.of(resetToken));
        when(passwordEncoder.encode(newPassword)).thenReturn("encodedNewPassword");

        authService.resetPassword(token, newPassword);

        assertEquals("encodedNewPassword", user.getPasswordHash());

        verify(userRepository).save(user);
        verify(tokenRepo).delete(resetToken);
    }

    @Test
    void resetPassword_shouldThrowWhenTokenInvalid() {
        when(tokenRepo.findByToken("invalid")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.resetPassword("invalid", "password"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Invalid");
    }

    @Test
    void resetPassword_shouldThrowWhenTokenExpired() {
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken("token");
        resetToken.setExpiryDate(LocalDateTime.now().minusMinutes(1));

        when(tokenRepo.findByToken("token")).thenReturn(Optional.of(resetToken));

        assertThatThrownBy(() -> authService.resetPassword("token", "password"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("token expired");
    }

    @Test
    void resetPassword_shouldThrowWhenUserNotFound() {
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken("token");
        resetToken.setUser(null); // <-- IMPORTANT
        resetToken.setExpiryDate(LocalDateTime.now().plusMinutes(5));

        when(tokenRepo.findByToken("token")).thenReturn(Optional.of(resetToken));

        assertThatThrownBy(() -> authService.resetPassword("token", "password"))
                .isInstanceOf(UserNotFoundForPasswordResetException.class)
                .hasMessageContaining("Unknown user");
    }

    @Test
    void deleteAccount_shouldDeleteUserAndTokens() {
        String email = "test@example.com";
        String password = "password";

        User user = new User();
        user.setEmail(email);

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(authenticationManager.authenticate(any())).thenReturn(auth);

        authService.deleteAccount(email, password);

        verify(tokenRepo).deleteAllByUser(user);

        verify(userRepository).delete(user);
    }

    @Test
    void deleteAccount_shouldThrowWhenUserDoesNotExist() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        assertThrows(EmailNotFoundException.class,
                () -> authService.deleteAccount("missing@example.com", "pass"));
    }

    @Test
    void deleteAccount_shouldThrowWhenPasswordInvalid() {
        String email = "test@example.com";
        User user = new User();
        user.setEmail(email);

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Bad password"));

        assertThrows(BadCredentialsException.class,
                () -> authService.deleteAccount(email, "wrongpass"));
    }

    @Test
    void deleteAccount_shouldThrowWhenAuthenticationNotAuthenticated() {
        String email = "test@example.com";
        User user = new User();
        user.setEmail(email);

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(false);

        when(authenticationManager.authenticate(any())).thenReturn(auth);

        assertThrows(BadCredentialsException.class,
                () -> authService.deleteAccount(email, "password"));
    }

    @Test
    void authenticateWithGoogleIdToken_shouldReturnExistingUser() throws Exception {
        String tokenString = "valid_token";

        GoogleIdToken.Payload payload = new GoogleIdToken.Payload();
        payload.setEmail("test@example.com");
        payload.set("name", "Test User");

        GoogleIdToken googleIdToken = mock(GoogleIdToken.class);
        when(googleIdToken.getPayload()).thenReturn(payload);

        GoogleIdTokenVerifier verifierMock = mock(GoogleIdTokenVerifier.class);
        when(verifierMock.verify(tokenString)).thenReturn(googleIdToken);

        var field = AuthenticationServiceImpl.class.getDeclaredField("googleIdTokenVerifier");
        field.setAccessible(true);
        field.set(authService, verifierMock);

        User existingUser = new User("test@example.com", "pass", "Test User", UserRole.USER);
        when(userRepository.findByEmail("test@example.com"))
                .thenReturn(Optional.of(existingUser));

        User result = authService.authenticateWithGoogleIdToken(tokenString);

        assertSame(existingUser, result);
        verify(userRepository, never()).save(any());
    }

    @Test
    void authenticateWithGoogleIdToken_shouldCreateNewUserIfNotExists() throws Exception {
        String tokenString = "valid_token";

        GoogleIdToken.Payload payload = new GoogleIdToken.Payload();
        payload.setEmail("newuser@example.com");
        payload.set("name", "New User");

        GoogleIdToken googleIdToken = mock(GoogleIdToken.class);
        when(googleIdToken.getPayload()).thenReturn(payload);

        GoogleIdTokenVerifier verifierMock = mock(GoogleIdTokenVerifier.class);
        when(verifierMock.verify(tokenString)).thenReturn(googleIdToken);

        var field = AuthenticationServiceImpl.class.getDeclaredField("googleIdTokenVerifier");
        field.setAccessible(true);
        field.set(authService, verifierMock);

        when(userRepository.findByEmail("newuser@example.com")).thenReturn(Optional.empty());

        User savedUser = new User();
        savedUser.setEmail("newuser@example.com");
        savedUser.setDisplayName("New User");
        savedUser.setPasswordHash("");

        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        User result = authService.authenticateWithGoogleIdToken(tokenString);

        assertEquals("newuser@example.com", result.getEmail());
        assertEquals("New User", result.getDisplayName());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void authenticateWithGoogleIdToken_shouldThrowWhenTokenIsNull() throws Exception {
        GoogleIdTokenVerifier verifierMock = mock(GoogleIdTokenVerifier.class);
        when(verifierMock.verify("invalid")).thenReturn(null);

        var field = AuthenticationServiceImpl.class.getDeclaredField("googleIdTokenVerifier");
        field.setAccessible(true);
        field.set(authService, verifierMock);

        assertThatThrownBy(() -> authService.authenticateWithGoogleIdToken("invalid"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Failed to verify Google token");
    }

    @Test
    void authenticateWithGoogleIdToken_shouldThrowWhenVerifierFails() throws Exception {
        GoogleIdTokenVerifier verifierMock = mock(GoogleIdTokenVerifier.class);
        when(verifierMock.verify(anyString()))
                .thenThrow(new RuntimeException("Verifier failure"));

        var field = AuthenticationServiceImpl.class.getDeclaredField("googleIdTokenVerifier");
        field.setAccessible(true);
        field.set(authService, verifierMock);

        assertThatThrownBy(() -> authService.authenticateWithGoogleIdToken("token"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Failed to verify Google token");
    }
}