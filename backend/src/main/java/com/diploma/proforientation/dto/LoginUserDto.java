package com.diploma.proforientation.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Data Transfer Object used for user login requests.
 * <p>
 * This class captures the credentials submitted by the user when attempting to log in.
 * It includes validation to ensure the email and password are properly formatted and not empty.
 * </p>
 */
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class LoginUserDto {

    /**
     * The email address used to identify the user.
     * <p>
     * Must not be blank and must follow a valid email format.
     * </p>
     */
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    /**
     * The password corresponding to the provided email address.
     * <p>
     * Must not be blank. Must contains at least 6 characters.
     * </p>
     */
    @NotBlank(message = "Password is required")
    @Size(min=6)
    private String password;

    /**
     * A flag indicating whether the user wants to stay logged in across sessions.
     * <p>
     * If true, a long-lived refresh token will be issued.
     * </p>
     */
    private boolean rememberMe;

    public LoginUserDto(String email, String password) {
        this.email = email;
        this.password = password;
        this.rememberMe = false;
    }
}
