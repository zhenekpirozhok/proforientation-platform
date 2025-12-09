package com.diploma.proforientation.service;


import com.diploma.proforientation.dto.LoginUserDto;
import com.diploma.proforientation.dto.RegisterUserDto;
import com.diploma.proforientation.model.User;

public interface AuthenticationService {
    User signup(RegisterUserDto input);
    User authenticate(LoginUserDto input);
    void sendResetToken(String email);
    void resetPassword(String token, String newPassword);
    User authenticateWithGoogleIdToken(String idTokenString);
    void deleteAccount(String email, String password);
}
