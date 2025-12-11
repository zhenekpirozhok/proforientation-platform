package com.diploma.proforientation.service;

import com.diploma.proforientation.config.JwtProperties;
import com.diploma.proforientation.model.User;
import com.diploma.proforientation.model.enumeration.UserRole;
import com.diploma.proforientation.service.impl.JwtServiceImpl;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Base64;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;
    private JwtProperties jwtProperties;
    private User testUser;

    @BeforeEach
    void setUp() {
        jwtProperties = new JwtProperties();

        // Generate a 32-byte Base64 secret key
        byte[] secretBytes = new byte[32];
        for (int i = 0; i < 32; i++) secretBytes[i] = (byte) (i + 1);
        String base64Key = Base64.getEncoder().encodeToString(secretBytes);

        jwtProperties.setSecretKey(base64Key);
        jwtProperties.setExpirationTime(1000 * 60); // 1 minute
        jwtProperties.setLongRefreshExpirationTime(1000L * 60 * 60 * 24 * 30); // 30 days

        jwtService = new JwtServiceImpl(jwtProperties);

        testUser = new User("user@example.com", "hashed", "User", UserRole.USER);
    }

    @Test
    void testGenerateTokenReturnsNonNull() {
        String token = jwtService.generateToken(testUser);
        assertNotNull(token);
    }

    @Test
    void testExtractUsernameFromToken() {
        String token = jwtService.generateToken(testUser);
        String username = jwtService.extractUsername(token);

        assertEquals("user@example.com", username);
    }

    @Test
    void testExtractAllClaimsContainsRolesAndSubject() {
        String token = jwtService.generateToken(testUser);
        Claims claims = ((JwtServiceImpl) jwtService).extractAllClaims(token);

        assertEquals("user@example.com", claims.getSubject());
        assertTrue(claims.containsKey("roles"));

        List<String> roles = claims.get("roles", List.class);
        assertEquals(List.of("ROLE_USER"), roles);
    }

    @Test
    void testIsTokenValidForSameUser() {
        String token = jwtService.generateToken(testUser);
        assertTrue(jwtService.isTokenValid(token, testUser));
    }

    @Test
    void testIsTokenInvalidForDifferentUser() {
        String token = jwtService.generateToken(testUser);
        User other = new User("other@example.com", "p", "O", UserRole.USER);

        assertFalse(jwtService.isTokenValid(token, other));
    }

    @Test
    void testTokenExpiresCorrectly() throws InterruptedException {
        jwtProperties.setExpirationTime(50); // 50 ms
        jwtService = new JwtServiceImpl(jwtProperties);

        String token = jwtService.generateToken(testUser);

        Thread.sleep(60);

        assertThrows(io.jsonwebtoken.ExpiredJwtException.class,
                () -> jwtService.isTokenValid(token, testUser));
    }

    @Test
    void testGenerateRefreshTokenHasLongerExpiration() {
        String refresh = jwtService.generateRefreshToken(testUser);
        Claims claims = ((JwtServiceImpl) jwtService).extractAllClaims(refresh);

        long exp = claims.getExpiration().getTime();
        long now = System.currentTimeMillis();

        assertTrue(exp > now + jwtProperties.getExpirationTime());
    }

    @Test
    void testGenerateLongLivedRefreshTokenWorks() {
        String refresh = jwtService.generateLongLivedRefreshToken(testUser);
        Claims claims = ((JwtServiceImpl) jwtService).extractAllClaims(refresh);

        long exp = claims.getExpiration().getTime();
        long now = System.currentTimeMillis();

        assertTrue(exp > now + (1000L * 60 * 60 * 24 * 10)); // at least 10 days
    }

    @Test
    void testGetExpirationTimeReturnsConfiguredValue() {
        assertEquals(jwtProperties.getExpirationTime(), jwtService.getExpirationTime());
    }
}