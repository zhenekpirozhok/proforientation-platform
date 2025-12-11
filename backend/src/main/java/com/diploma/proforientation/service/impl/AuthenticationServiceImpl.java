package com.diploma.proforientation.service.impl;

import com.diploma.proforientation.dto.LoginUserDto;
import com.diploma.proforientation.dto.RegisterUserDto;
import com.diploma.proforientation.exception.*;
import com.diploma.proforientation.model.PasswordResetToken;
import com.diploma.proforientation.model.User;
import com.diploma.proforientation.model.enumeration.UserRole;
import com.diploma.proforientation.repository.PasswordResetTokenRepository;
import com.diploma.proforientation.repository.UserRepository;
import com.diploma.proforientation.service.AuthenticationService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import org.springframework.beans.factory.annotation.Value;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.time.LocalDateTime;
import java.util.UUID;

@Service
@Slf4j
public class AuthenticationServiceImpl implements AuthenticationService {
    private static final String TOKEN_NAME = "name";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final PasswordResetTokenRepository tokenRepo;
    private final EmailServiceImpl emailServiceImpl;
    private final GoogleIdTokenVerifier googleIdTokenVerifier;

    public AuthenticationServiceImpl(
            @Value("${google.client-id}") String googleClientId,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            PasswordResetTokenRepository tokenRepo,
            EmailServiceImpl emailServiceImpl,
            GoogleIdTokenVerifier googleIdTokenVerifier) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenRepo = tokenRepo;
        this.emailServiceImpl = emailServiceImpl;
        this.googleIdTokenVerifier = googleIdTokenVerifier;
    }

    public User signup(RegisterUserDto input) {
        User user = new User(input.getEmail(), passwordEncoder.encode(input.getPassword()),
                input.getDisplayName(), UserRole.USER);
        log.debug("Added user: {}", user.getEmail());
        return userRepository.save(user);
    }

    public User authenticate(LoginUserDto input) {
        Authentication authenticate = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(input.getEmail(), input.getPassword()));

        Object principal = authenticate.getPrincipal();
        if (principal != null && User.class.isAssignableFrom(principal.getClass())) {
            User user = (User) principal;
            log.debug("Authenticated user: {}", user.getEmail());
            return user;
        }

        throw new BadCredentialsException("Invalid email or password");
    }

    public void sendResetToken(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EmailNotFoundException(email));

        String token = UUID.randomUUID().toString();
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(15);

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUser(user);
        resetToken.setExpiryDate(expiry);

        tokenRepo.save(resetToken);
        emailServiceImpl.sendResetPasswordEmail(email, token);
    }

    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepo.findByToken(token)
                .orElseThrow(InvalidPasswordResetTokenException::new);

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new ExpiredPasswordResetTokenException(resetToken.getExpiryDate());
        }

        User user = resetToken.getUser();

        if (user == null) {
            throw new UserNotFoundForPasswordResetException("Unknown user");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        tokenRepo.delete(resetToken);
    }

    public User authenticateWithGoogleIdToken(String idTokenString) {
        try {
            GoogleIdToken idToken = googleIdTokenVerifier.verify(idTokenString);
            if (idToken == null) {
                throw new RuntimeException("Invalid Google ID token");
            }

            String email = idToken.getPayload().getEmail();
            String name = (String) idToken.getPayload().get(TOKEN_NAME);

            return userRepository.findByEmail(email)
                    .orElseGet(() -> {
                        User newUser = new User();
                        newUser.setEmail(email);
                        newUser.setDisplayName(name);
                        newUser.setPasswordHash(""); // no password for Google users
                        return userRepository.save(newUser);
                    });
        } catch (Exception e) {
            throw new RuntimeException("Failed to verify Google token", e);
        }
    }

    /**
     * Deletes a user account permanently.
     * <p>
     * The user must authenticate using their password before deletion.
     * The method also removes any password reset tokens associated with the user.
     *
     * @param email    the email of the user requesting deletion
     * @param password the user's password for re-authentication
     * @throws EmailNotFoundException          if no user exists with the given email
     * @throws BadCredentialsException        if the password is invalid
     */
    @Transactional
    public void deleteAccount(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EmailNotFoundException(email));

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
        );

        if (!authentication.isAuthenticated()) {
            throw new BadCredentialsException("Password verification failed");
        }

        log.info("Deleting account for user: {}", email);

        tokenRepo.deleteAllByUser(user);
        userRepository.delete(user);

        log.info("Account successfully deleted: {}", email);
    }
}