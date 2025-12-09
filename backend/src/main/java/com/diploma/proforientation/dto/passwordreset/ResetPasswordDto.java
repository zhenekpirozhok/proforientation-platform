package com.diploma.proforientation.dto.passwordreset;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Data Transfer Object for resetting a user's password.
 * <p>
 * This DTO is used when a user submits a new password using a reset token sent to their email.
 * It includes the user's email, the reset token, and the new password with validation.
 * </p>
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordDto {

    /**
     * The password reset token sent to the user's email.
     * <p>
     * Used to verify that the password reset request is valid.
     * </p>
     */
    private String token;

    /**
     * The new password that the user wants to set.
     * <p>
     * Must not be blank and must contain at least one number.
     * Must contains at least 6 characters.
     * </p>
     */
    @NotBlank(message = "Password is required")
    @Size(min = 6)
    @Pattern(
            regexp = ".*\\d.*",
            message = "Password must contain at least one number"
    )
    private String newPassword;
}