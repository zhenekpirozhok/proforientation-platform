package com.diploma.proforientation.service.impl;


import com.diploma.proforientation.model.User;
import com.diploma.proforientation.repository.UserRepository;
import com.diploma.proforientation.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;

    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<User> getAllUsers() {
        List<User> users = new ArrayList<>();
        userRepository.findAll().forEach(users::add);
        log.debug(String.valueOf(users.size()));
        return users;
    }
}

