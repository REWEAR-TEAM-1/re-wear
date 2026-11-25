package com.rewear.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;

    public AuthController(
            AuthService authService,
            AuthenticationManager authenticationManager,
            SecurityContextRepository securityContextRepository
    ) {
        this.authService = authService;
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
    }

    @GetMapping("/csrf")
    public AuthResponses.Csrf csrf(@RequestAttribute("_csrf") CsrfToken csrfToken) {
        return new AuthResponses.Csrf(csrfToken.getToken());
    }

    @GetMapping("/me")
    public AuthResponses.Session currentSession(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof RewearUserDetails userDetails)) {
            return new AuthResponses.Session(false, null);
        }
        return new AuthResponses.Session(true, authService.toResponse(userDetails.getAccount()));
    }

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponses.Session signUp(
            @Valid @RequestBody AuthRequests.SignUp request,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse
    ) {
        authService.register(request);
        return authenticate(request.email(), request.password(), servletRequest, servletResponse);
    }

    @PostMapping("/signin")
    public AuthResponses.Session signIn(
            @Valid @RequestBody AuthRequests.SignIn request,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse
    ) {
        return authenticate(request.email(), request.password(), servletRequest, servletResponse);
    }

    @PostMapping("/signout")
    public ResponseEntity<Void> signOut(HttpServletRequest request) {
        SecurityContextHolder.clearContext();
        if (request.getSession(false) != null) {
            request.getSession(false).invalidate();
        }
        return ResponseEntity.noContent().build();
    }

    private AuthResponses.Session authenticate(
            String email,
            String password,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        Authentication authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(email, password)
        );
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, request, response);
        RewearUserDetails userDetails = (RewearUserDetails) authentication.getPrincipal();
        return new AuthResponses.Session(true, authService.toResponse(userDetails.getAccount()));
    }
}
