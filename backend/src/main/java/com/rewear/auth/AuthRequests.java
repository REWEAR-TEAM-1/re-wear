package com.rewear.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthRequests {
    private AuthRequests() {
    }

    public record SignUp(
            @NotBlank @Size(max = 80) String name,
            @NotBlank @Email @Size(max = 320) String email,
            @NotBlank @Size(min = 8, max = 128) String password
    ) {
    }

    public record SignIn(
            @NotBlank @Email @Size(max = 320) String email,
            @NotBlank @Size(max = 128) String password
    ) {
    }
}
