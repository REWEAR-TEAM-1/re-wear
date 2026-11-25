package com.rewear.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthApiIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Test
    void signupHashesPasswordCreatesSessionAndAllowsSignout() throws Exception {
        String email = uniqueEmail();
        String password = "safe-password-123";
        MvcResult signup = mockMvc.perform(post("/api/auth/signup")
                        .with(csrf())
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsBytes(new AuthRequests.SignUp("A Seller", email, password))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.authenticated").value(true))
                .andExpect(jsonPath("$.user.name").value("A Seller"))
                .andExpect(jsonPath("$.user.email").value(email))
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist())
                .andReturn();

        assertNotNull(userAccountRepository.findByEmail(email).orElseThrow().getPasswordHash());
        assertNotEquals(password, userAccountRepository.findByEmail(email).orElseThrow().getPasswordHash());
        MockHttpSession session = (MockHttpSession) signup.getRequest().getSession(false);
        assertNotNull(session);

        mockMvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(true))
                .andExpect(jsonPath("$.user.email").value(email));

        mockMvc.perform(post("/api/auth/signout").session(session).with(csrf()))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(false));
    }

    @Test
    void signinRejectsWrongPasswordAndDuplicateEmail() throws Exception {
        String email = uniqueEmail();
        String password = "safe-password-123";
        mockMvc.perform(post("/api/auth/signup")
                        .with(csrf())
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsBytes(new AuthRequests.SignUp("A Seller", email, password))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/signin")
                        .with(csrf())
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsBytes(new AuthRequests.SignIn(email, "wrong-password"))))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/auth/signin")
                        .with(csrf())
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsBytes(new AuthRequests.SignIn(email, password))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(true));

        mockMvc.perform(post("/api/auth/signup")
                        .with(csrf())
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsBytes(new AuthRequests.SignUp("Duplicate", email.toUpperCase(), password))))
                .andExpect(status().isConflict());
    }

    @Test
    void listingCreationRequiresAuthenticationAndCsrfProtection() throws Exception {
        mockMvc.perform(post("/api/listings")
                        .with(csrf())
                        .contentType("application/json")
                        .content("{}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(multipart("/api/uploads")
                        .file(new MockMultipartFile("file", "photo.png", "image/png", new byte[]{1}))
                        .with(csrf()))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/auth/signup")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsBytes(
                                new AuthRequests.SignUp("A Seller", uniqueEmail(), "safe-password-123"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void csrfEndpointReturnsTheTokenAndSetsItsCookie() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/auth/csrf"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn();

        assertNotNull(result.getResponse().getCookie("XSRF-TOKEN"));
    }

    private String uniqueEmail() {
        return "seller-" + UUID.randomUUID() + "@example.com";
    }
}
