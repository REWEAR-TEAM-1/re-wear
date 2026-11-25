package com.rewear.auth;

public final class AuthResponses {
    private AuthResponses() {
    }

    public record User(Long id, String name, String email) {
    }

    public record Session(boolean authenticated, User user) {
    }

    public record Csrf(String token) {
    }
}
