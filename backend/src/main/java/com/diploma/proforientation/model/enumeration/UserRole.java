package com.diploma.proforientation.model.enumeration;

import lombok.Getter;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

/**
 * Enum representing available user roles.
 */
@Getter
public enum UserRole {
    USER("ROLE_USER"),
    ADMIN("ROLE_ADMIN");

    private final String authority;

    UserRole(String authority) {
        this.authority = authority;
    }

    public SimpleGrantedAuthority asAuthority() {
        return new SimpleGrantedAuthority(authority);
    }
}