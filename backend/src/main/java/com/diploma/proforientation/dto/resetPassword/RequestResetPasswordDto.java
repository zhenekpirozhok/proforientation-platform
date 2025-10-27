package com.diploma.proforientation.dto.resetPassword;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * Data Transfer Object for requesting a password reset.
 * <p>
 * This DTO is used when a user submits a request to reset their password.
 * It captures and validates the email address to ensure it is present and properly formatted.
 * </p>
 */
@Getter
@Setter
public class RequestResetPasswordDto {

    /**
     * The email address associated with the user's account.
     * <p>
     * Must not be blank and must be a valid email format.
     * </p>
     */
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;
}
