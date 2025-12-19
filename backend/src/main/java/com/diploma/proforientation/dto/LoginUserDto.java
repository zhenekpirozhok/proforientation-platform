package com.diploma.proforientation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
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
@Schema(description = "Request payload used for authenticating a user")
public class LoginUserDto {

    /**
     * The email address used to identify the user.
     * <p>
     * Must not be blank and must follow a valid email format.
     * </p>
     */
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Schema(
            description = "Email address used for user authentication",
            examples = "user@example.com",
            requiredMode = Schema.RequiredMode.REQUIRED
    )
    private String email;

    /**
     * The password corresponding to the provided email address.
     * <p>
     * Must not be blank. Must contain at least 6 characters.
     * </p>
     */
    @NotBlank(message = "Password is required")
    @Size(min=6)
    @Schema(
            description = "User password (minimum 6 characters)",
            examples = "pass123",
            requiredMode = Schema.RequiredMode.REQUIRED,
            minLength = 6
    )
    private String password;

    /**
     * A flag indicating whether the user wants to stay logged in across sessions.
     * <p>
     * If true, a long-lived refresh token will be issued.
     * </p>
     */
    @Schema(
            description = "If true, a long-lived refresh token will be issued",
            examples = "false",
            defaultValue = "false"
    )
    private boolean rememberMe;

    public LoginUserDto(String email, String password) {
        this.email = email;
        this.password = password;
        this.rememberMe = false;
    }
}
