package com.diploma.proforientation.service;

import com.diploma.proforientation.model.User;
import com.diploma.proforientation.model.enumeration.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface UserService {
    Page<User> getAllUsers(Pageable pageable);
    Optional<Integer> findIdByEmail(String email);
    void changeUserRole(Integer userId, UserRole newRole);
}
