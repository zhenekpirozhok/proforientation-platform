package com.diploma.proforientation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
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
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "Request payload for user registration")
public class RegisterUserDto {

    /**
     * The email address of the user.
     * <p>
     * Must not be blank and must be a valid email format.
     * </p>
     */
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Schema(
            description = "User email address used for authentication",
            examples = "user@example.com",
            requiredMode = Schema.RequiredMode.REQUIRED
    )
    private String email;

    /**
     * The username of the user.
     */
    @Schema(
            description = "Display name shown in the application UI",
            examples = "John Doe"
    )
    private String displayName;

    /**
     * The password for the user's account.
     * <p>
     * Must not be blank and must contain at least one numeric digit.
     * Must contain at least 6 characters.
     * </p>
     */
    @NotBlank(message = "Password is required")
    @Size(min=6)
    @Pattern(
            regexp = ".*\\d.*",
            message = "Password must contain at least one number"
    )
    @Schema(
            description = """
                    User password.
                    Must be at least 6 characters long and contain at least one numeric digit.
                    """,
            examples = "pass123",
            minLength = 6,
            requiredMode = Schema.RequiredMode.REQUIRED
    )
    private String password;
}
