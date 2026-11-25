package com.rewear.auth;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

@Service
public class AuthService implements UserDetailsService {
    private final UserAccountRepository repository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserAccountRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserAccount register(AuthRequests.SignUp request) {
        String email = normalizeEmail(request.email());
        if (repository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }

        try {
            return repository.saveAndFlush(new UserAccount(
                    request.name().trim(),
                    email,
                    passwordEncoder.encode(request.password())
            ));
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists.", exception);
        }
    }

    public UserAccount findByEmail(String email) {
        return repository.findByEmail(normalizeEmail(email))
                .orElseThrow(() -> new UsernameNotFoundException("Account not found."));
    }

    public AuthResponses.User toResponse(UserAccount account) {
        return new AuthResponses.User(account.getId(), account.getName(), account.getEmail());
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return new RewearUserDetails(findByEmail(email));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
