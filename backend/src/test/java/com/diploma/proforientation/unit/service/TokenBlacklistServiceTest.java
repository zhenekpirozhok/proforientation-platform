package com.diploma.proforientation.unit.service;

import com.diploma.proforientation.service.TokenBlacklistService;
import com.diploma.proforientation.service.impl.TokenBlacklistServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class TokenBlacklistServiceTest {

    private TokenBlacklistService blacklistService;

    @BeforeEach
    void setUp() {
        blacklistService = new TokenBlacklistServiceImpl();
    }

    @Test
    void testBlacklistTokenAddsToken() {
        String token = "test-token";

        assertFalse(blacklistService.isBlacklisted(token), "Token should not be blacklisted initially");

        blacklistService.blacklistToken(token);

        assertTrue(blacklistService.isBlacklisted(token), "Token should be blacklisted after calling blacklistToken");
    }

    @Test
    void testIsBlacklistedReturnsFalseForUnknownToken() {
        String token = "unknown-token";
        assertFalse(blacklistService.isBlacklisted(token), "Unknown token should not be blacklisted");
    }

    @Test
    void testMultipleTokensBlacklistedIndependently() {
        String token1 = "token1";
        String token2 = "token2";

        blacklistService.blacklistToken(token1);

        assertTrue(blacklistService.isBlacklisted(token1), "token1 should be blacklisted");
        assertFalse(blacklistService.isBlacklisted(token2), "token2 should not be blacklisted yet");

        blacklistService.blacklistToken(token2);

        assertTrue(blacklistService.isBlacklisted(token1), "token1 should still be blacklisted");
        assertTrue(blacklistService.isBlacklisted(token2), "token2 should now be blacklisted");
    }

    @Test
    void testBlacklistingSameTokenMultipleTimes() {
        String token = "duplicate-token";

        blacklistService.blacklistToken(token);
        blacklistService.blacklistToken(token);

        assertTrue(blacklistService.isBlacklisted(token), "Token should still be blacklisted");
    }
}
