package com.diploma.proforientation.repository;

import com.diploma.proforientation.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository interface for managing {@link User} entities.
 * <p>
 * Extends {@link JpaRepository},
 * identified by their UUID.
 * </p>
 */
@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    /**
     * Finds a {@link User} entity by its unique email address.
     *
     * @param email the email address to search by
     * @return an {@link Optional} containing the user if found, or empty if not found
     */
    Optional<User> findByEmail(String email);
    @Query("SELECT u.id FROM User u WHERE u.email = :email")
    Optional<Integer> findIdByEmail(@Param("email") String email);
    boolean existsByEmail(String email);
}