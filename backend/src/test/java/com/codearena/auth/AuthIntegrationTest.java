package com.codearena.auth;

import com.codearena.auth.dto.LoginRequest;
import com.codearena.auth.dto.RegisterRequest;
import com.codearena.auth.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Integration: Register then login sets cookie, and /api/auth/me works with cookie")
    void testRegisterLoginAndAccessProtectedMeEndpoint() throws Exception {
        // 1. Register a new user
        RegisterRequest registerRequest = RegisterRequest.builder()
                .username("competitive_coder")
                .email("Coder@CodeArena.com")
                .password("superSecret123")
                .confirmPassword("superSecret123")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.username").value("competitive_coder"))
                .andExpect(jsonPath("$.email").value("coder@codearena.com"))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());

        // 2. Login with registered user - should set access_token cookie
        LoginRequest loginRequest = LoginRequest.builder()
                .identifier("competitive_coder")
                .password("superSecret123")
                .build();

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("access_token"))
                .andExpect(cookie().httpOnly("access_token", true))
                .andExpect(cookie().path("access_token", "/"))
                .andExpect(jsonPath("$.username").value("competitive_coder"))
                .andExpect(jsonPath("$.email").value("coder@codearena.com"))
                .andExpect(jsonPath("$.token").doesNotExist())
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andReturn();

        Cookie authCookie = loginResult.getResponse().getCookie("access_token");
        assertThat(authCookie).isNotNull();
        assertThat(authCookie.getValue()).isNotEmpty();

        // 3. /api/auth/me with valid cookie returns 200 and user details
        mockMvc.perform(get("/api/auth/me")
                        .cookie(authCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("competitive_coder"))
                .andExpect(jsonPath("$.email").value("coder@codearena.com"))
                .andExpect(jsonPath("$.id").isNotEmpty());

        // 4. Logout clears the cookie
        mockMvc.perform(post("/api/auth/logout")
                        .cookie(authCookie))
                .andExpect(status().isOk())
                .andExpect(cookie().maxAge("access_token", 0))
                .andExpect(jsonPath("$.message").value("Logged out successfully"));
    }

    @Test
    @DisplayName("Integration: /api/auth/me returns 401 JSON when accessed without cookie")
    void testMeWithoutCookieReturns401() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Full authentication is required to access this resource"))
                .andExpect(jsonPath("$.timestamp").isNotEmpty());
    }

    @Test
    @DisplayName("Integration: Register duplicate username returns 409 Conflict")
    void testRegisterDuplicateUsernameReturns409() throws Exception {
        RegisterRequest user1 = RegisterRequest.builder()
                .username("john_doe")
                .email("john@codearena.com")
                .password("password123")
                .confirmPassword("password123")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(user1)))
                .andExpect(status().isCreated());

        RegisterRequest duplicateUsername = RegisterRequest.builder()
                .username("john_doe")
                .email("different_email@codearena.com")
                .password("password123")
                .confirmPassword("password123")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicateUsername)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Username is already taken"));
    }

    @Test
    @DisplayName("Integration: Register invalid request returns 400 with per-field messages")
    void testRegisterValidationFailureReturns400() throws Exception {
        RegisterRequest invalidRequest = RegisterRequest.builder()
                .username("a") // too short
                .email("not-an-email") // invalid email
                .password("short") // too short (< 8)
                .confirmPassword("short")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errors.username").isNotEmpty())
                .andExpect(jsonPath("$.errors.email").isNotEmpty())
                .andExpect(jsonPath("$.errors.password").isNotEmpty());
    }

    @Test
    @DisplayName("Integration: Malformed JSON returns 400 Bad Request")
    void testMalformedJsonReturns400() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\": \"test\", confirmPassword: \"missing_quotes\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Malformed or unreadable JSON request body"));
    }

    @Test
    @DisplayName("Integration: Actuator health and prometheus endpoints are accessible")
    void testActuatorEndpoints() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));

        mockMvc.perform(get("/actuator/prometheus"))
                .andExpect(status().isOk());
    }
}
