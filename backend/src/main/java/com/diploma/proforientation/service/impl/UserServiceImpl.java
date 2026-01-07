package com.diploma.proforientation.service.impl;


import com.diploma.proforientation.model.User;
import com.diploma.proforientation.model.enumeration.UserRole;
import com.diploma.proforientation.repository.UserRepository;
import com.diploma.proforientation.service.UserService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static com.diploma.proforientation.util.Constants.CANNOT_CHANGE_OWN_ROLE;
import static com.diploma.proforientation.util.Constants.USER_NOT_FOUND;

@Service
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;

    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<User> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    @Override
    public Optional<Integer> findIdByEmail(String email) {
        return userRepository.findIdByEmail(email);
    }

    @Override
    @Transactional
    public void changeUserRole(Integer userId, UserRole newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException(USER_NOT_FOUND));

        if (SecurityContextHolder.getContext()
                .getAuthentication()
                .getName()
                .equals(user.getEmail())) {
            throw new IllegalStateException(CANNOT_CHANGE_OWN_ROLE);
        }

        user.setRole(newRole);
    }
}

