package com.diploma.proforientation.repository;

import com.diploma.proforientation.model.User;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository interface for managing {@link User} entities.
 * <p>
 * Extends {@link CrudRepository} to provide CRUD operations on users,
 * identified by their UUID.
 * </p>
 */
@Repository
public interface UserRepository extends CrudRepository<User, Long> {

    /**
     * Finds a {@link User} entity by its unique email address.
     *
     * @param email the email address to search by
     * @return an {@link Optional} containing the user if found, or empty if not found
     */
    Optional<User> findByEmail(String email);
}