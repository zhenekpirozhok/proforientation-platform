package com.diploma.proforientation.service.impl;

import com.diploma.proforientation.config.JwtProperties;
import com.diploma.proforientation.model.User;
import com.diploma.proforientation.service.JwtService;
import com.diploma.proforientation.service.TokenBlacklistService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

@Service
@Slf4j
@RequiredArgsConstructor
public class JwtServiceImpl implements JwtService {
    private static final String ROLES_CLAIMS = "roles";

    private final JwtProperties jwtProperties;
    private final TokenBlacklistService tokenBlacklistService;

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }

    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return buildToken(extraClaims, userDetails, jwtProperties.getExpirationTime());
    }

    public long getExpirationTime() {
        return jwtProperties.getExpirationTime();
    }

    private String buildToken(
            Map<String, Object> extraClaims,
            UserDetails userDetails,
            long expirationTime) {

        User user = (User) userDetails;
        log.debug("Build token for {}", user.getEmail());

        List<String> roles = user.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        extraClaims = new HashMap<>(extraClaims);
        extraClaims.put(ROLES_CLAIMS, roles);

        return Jwts.builder()
                .claims(extraClaims)
                .subject(user.getEmail())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationTime))
                .signWith(getSignInKey())
                .compact();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        User user = (User) userDetails;
        final String extractedEmail = extractUsername(token);

        if (tokenBlacklistService.isBlacklisted(token)) {
            log.warn("Token is blacklisted: {}", token);
            return false;
        }

        return extractedEmail.equals(user.getEmail()) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSignInKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtProperties.getSecretKey());
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateRefreshToken(UserDetails userDetails) {
        long refreshExpiration = jwtProperties.getExpirationTime() * 2;
        return buildToken(new HashMap<>(), userDetails, refreshExpiration);
    }

    public String generateLongLivedRefreshToken(UserDetails userDetails) {
        return buildToken(new HashMap<>(), userDetails, jwtProperties.getLongRefreshExpirationTime());
    }

    @Override
    public void logout(String token) {
        tokenBlacklistService.blacklistToken(token);
        log.info("Token blacklisted: {}", token);
    }
}