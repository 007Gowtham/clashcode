package com.codearena.auth.service;

import com.codearena.auth.dto.LoginRequest;
import com.codearena.auth.dto.LoginResult;
import com.codearena.auth.dto.RegisterRequest;
import com.codearena.auth.dto.UserResponse;
import com.codearena.auth.entity.User;
import com.codearena.auth.exception.DuplicateResourceException;
import com.codearena.auth.exception.InvalidCredentialsException;
import com.codearena.auth.exception.PasswordMismatchException;
import com.codearena.auth.repository.UserRepository;
import com.codearena.auth.security.JwtService;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, passwordEncoder, jwtService, new SimpleMeterRegistry());
    }

    @Test
    @DisplayName("register success - saves user and returns user info without password")
    void register_Success() {
        RegisterRequest request = RegisterRequest.builder()
                .username("alice_dsa")
                .email("Alice@Example.com")
                .password("securePassword123")
                .confirmPassword("securePassword123")
                .build();

        when(userRepository.existsByUsername("alice_dsa")).thenReturn(false);
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(false);
        when(passwordEncoder.encode("securePassword123")).thenReturn("hashed_secure_pass");

        UUID generatedId = UUID.randomUUID();
        Instant now = Instant.now();
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(generatedId);
            user.setCreatedAt(now);
            return user;
        });

        UserResponse response = authService.register(request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(generatedId);
        assertThat(response.getUsername()).isEqualTo("alice_dsa");
        assertThat(response.getEmail()).isEqualTo("alice@example.com"); // lowercased
        assertThat(response.getCreatedAt()).isEqualTo(now);

        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("register duplicate email - throws DuplicateResourceException")
    void register_DuplicateEmail() {
        RegisterRequest request = RegisterRequest.builder()
                .username("new_coder")
                .email("existing@example.com")
                .password("password123")
                .confirmPassword("password123")
                .build();

        when(userRepository.existsByUsername("new_coder")).thenReturn(false);
        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessage("Email is already registered");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("register duplicate username - throws DuplicateResourceException")
    void register_DuplicateUsername() {
        RegisterRequest request = RegisterRequest.builder()
                .username("duplicate_user")
                .email("unique@example.com")
                .password("password123")
                .confirmPassword("password123")
                .build();

        when(userRepository.existsByUsername("duplicate_user")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessage("Username is already taken");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("register password mismatch - throws PasswordMismatchException")
    void register_PasswordMismatch() {
        RegisterRequest request = RegisterRequest.builder()
                .username("valid_user")
                .email("valid@example.com")
                .password("password123")
                .confirmPassword("differentPassword")
                .build();

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(PasswordMismatchException.class)
                .hasMessage("Passwords do not match");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("login success with username - returns user and JWT token")
    void login_Success_WithUsername() {
        LoginRequest request = LoginRequest.builder()
                .identifier("alice_dsa")
                .password("securePassword123")
                .build();

        UUID userId = UUID.randomUUID();
        User mockUser = User.builder()
                .id(userId)
                .username("alice_dsa")
                .email("alice@example.com")
                .passwordHash("hashed_password")
                .createdAt(Instant.now())
                .build();

        when(userRepository.findByUsername("alice_dsa")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("securePassword123", "hashed_password")).thenReturn(true);
        when(jwtService.generateToken(userId, "alice_dsa")).thenReturn("mock.jwt.token");

        LoginResult result = authService.login(request);

        assertThat(result).isNotNull();
        assertThat(result.getUser().getId()).isEqualTo(userId);
        assertThat(result.getUser().getUsername()).isEqualTo("alice_dsa");
        assertThat(result.getToken()).isEqualTo("mock.jwt.token");
    }

    @Test
    @DisplayName("login success with email - returns user and JWT token")
    void login_Success_WithEmail() {
        LoginRequest request = LoginRequest.builder()
                .identifier("Alice@Example.com")
                .password("securePassword123")
                .build();

        UUID userId = UUID.randomUUID();
        User mockUser = User.builder()
                .id(userId)
                .username("alice_dsa")
                .email("alice@example.com")
                .passwordHash("hashed_password")
                .createdAt(Instant.now())
                .build();

        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("securePassword123", "hashed_password")).thenReturn(true);
        when(jwtService.generateToken(userId, "alice_dsa")).thenReturn("mock.jwt.token");

        LoginResult result = authService.login(request);

        assertThat(result).isNotNull();
        assertThat(result.getUser().getId()).isEqualTo(userId);
        assertThat(result.getToken()).isEqualTo("mock.jwt.token");
    }

    @Test
    @DisplayName("login wrong password - throws InvalidCredentialsException")
    void login_WrongPassword() {
        LoginRequest request = LoginRequest.builder()
                .identifier("alice_dsa")
                .password("wrongPassword")
                .build();

        User mockUser = User.builder()
                .id(UUID.randomUUID())
                .username("alice_dsa")
                .email("alice@example.com")
                .passwordHash("hashed_password")
                .build();

        when(userRepository.findByUsername("alice_dsa")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("wrongPassword", "hashed_password")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessage("Invalid credentials");

        verify(jwtService, never()).generateToken(any(), any());
    }

    @Test
    @DisplayName("login unknown user - throws InvalidCredentialsException with same generic message")
    void login_UnknownUser() {
        LoginRequest request = LoginRequest.builder()
                .identifier("unknown_user")
                .password("somePassword123")
                .build();

        when(userRepository.findByUsername("unknown_user")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessage("Invalid credentials");

        verify(jwtService, never()).generateToken(any(), any());
    }
}

