package com.diploma.proforientation.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GoogleOneTapLoginRequest {

    @NotBlank(message = "Token must not be blank")
    private String token;
}
