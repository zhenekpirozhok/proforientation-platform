package com.diploma.proforientation.service;

import com.diploma.proforientation.model.User;

import java.util.List;
import java.util.Optional;

public interface UserService {
    List<User> getAllUsers();
    Optional<Integer> findIdByEmail(String email);
}
