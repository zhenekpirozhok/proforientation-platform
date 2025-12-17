package com.diploma.proforientation.service.impl;


import com.diploma.proforientation.model.User;
import com.diploma.proforientation.repository.UserRepository;
import com.diploma.proforientation.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;

    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Page<User> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    @Override
    public Optional<Integer> findIdByEmail(String email) {
        return userRepository.findIdByEmail(email);
    }
}

