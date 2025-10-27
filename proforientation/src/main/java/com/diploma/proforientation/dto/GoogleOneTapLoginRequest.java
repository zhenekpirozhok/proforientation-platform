package com.diploma.proforientation.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GoogleOneTapLoginRequest {

    @NotBlank(message = "Token must not be blank")
    private String token;
}
