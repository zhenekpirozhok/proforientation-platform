package com.diploma.proforientation.repository;

import com.diploma.proforientation.model.PasswordResetToken;
import com.diploma.proforientation.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Repository interface for managing {@link PasswordResetToken} entities.
 * <p>
 * Extends {@link JpaRepository} to provide standard CRUD operations and
 * custom finder methods for password reset tokens.
 * </p>
 */
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Integer> {

    /**
     * Finds a {@link PasswordResetToken} by its token string.
     *
     * @param token the unique token string
     * @return an {@link Optional} containing the token if found, or empty if not found
     */
    Optional<PasswordResetToken> findByToken(String token);
    void deleteAllByUser(User user);
}