package com.diploma.proforientation.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/**
 * Data Transfer Object for registering a new user.
 * <p>
 * This class is used to capture user input during the signup process.
 * It includes basic validation annotations to ensure data integrity.
 * </p>
 */
@Getter
@Setter
public class RegisterUserDto {

    /**
     * The email address of the user.
     * <p>
     * Must not be blank and must be a valid email format.
     * </p>
     */
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    /**
     * The username of the user.
     */
    private String displayName;

    /**
     * The password for the user's account.
     * <p>
     * Must not be blank and must contain at least one numeric digit.
     * Must contains at least 6 characters.
     * </p>
     */
    @NotBlank(message = "Password is required")
    @Size(min=6)
    @Pattern(
            regexp = ".*\\d.*",
            message = "Password must contain at least one number"
    )
    private String password;
}
