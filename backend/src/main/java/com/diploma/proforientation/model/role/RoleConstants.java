package com.diploma.proforientation.model.role;

import org.springframework.stereotype.Component;

/**
 * Exposes role constants for Spring Expression Language (SpEL)
 * to avoid magic strings inside @PreAuthorize expressions.
 */
@Component("Roles")
public class RoleConstants {

    public final String ADMIN = UserRole.ADMIN.getAuthority();
    public final String USER  = UserRole.USER.getAuthority();
}