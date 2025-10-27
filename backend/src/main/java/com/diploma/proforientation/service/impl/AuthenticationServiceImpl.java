package com.diploma.proforientation.service.impl;

import com.diploma.proforientation.dto.LoginUserDto;
import com.diploma.proforientation.dto.RegisterUserDto;
import com.diploma.proforientation.model.PasswordResetToken;
import com.diploma.proforientation.model.User;
import com.diploma.proforientation.repository.PasswordResetTokenRepository;
import com.diploma.proforientation.repository.UserRepository;
import com.diploma.proforientation.service.AuthenticationService;
import com.diploma.proforientation.service.EmailService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import org.springframework.beans.factory.annotation.Value;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.UUID;

@Service
@Slf4j
public class AuthenticationServiceImpl implements AuthenticationService {
    private final String googleClientId;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final PasswordResetTokenRepository tokenRepo;
    private final EmailService emailService;

    public AuthenticationServiceImpl(
            @Value("${google.client-id}") String googleClientId,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            PasswordResetTokenRepository tokenRepo, EmailService emailService) {
        this.googleClientId = googleClientId;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenRepo = tokenRepo;
        this.emailService = emailService;
    }

    public User signup(RegisterUserDto input) {
        User user = new User(input.getEmail(), passwordEncoder.encode(input.getPassword()),
                input.getDisplayName(),false);
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
        if (!userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email not found");
        }

        String token = UUID.randomUUID().toString();
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(15);

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setEmail(email);
        resetToken.setExpiryDate(expiry);

        tokenRepo.save(resetToken);
        emailService.sendResetPasswordEmail(email, token);
    }

    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepo.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid token"));

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Token expired");
        }

        User user = userRepository.findByEmail(resetToken.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        tokenRepo.delete(resetToken);
    }

    public User authenticateWithGoogleIdToken(String idTokenString) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    JacksonFactory.getDefaultInstance()
            )
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw new RuntimeException("Invalid Google ID token");
            }

            String email = idToken.getPayload().getEmail();
            String name = (String) idToken.getPayload().get("name");

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
}