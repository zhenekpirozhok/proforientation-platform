package com.diploma.proforientation.service;

public interface TokenBlacklistService {
    void blacklistToken(String token);
    boolean isBlacklisted(String token);
}
