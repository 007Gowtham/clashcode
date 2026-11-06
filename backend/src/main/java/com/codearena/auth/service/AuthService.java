package com.codearena.auth.service;

import com.codearena.auth.dto.LoginRequest;
import com.codearena.auth.dto.LoginResult;
import com.codearena.auth.dto.RegisterRequest;
import com.codearena.auth.dto.UserResponse;
import com.codearena.auth.entity.Role;
import com.codearena.auth.entity.User;
import com.codearena.auth.exception.DuplicateResourceException;
import com.codearena.auth.exception.InvalidCredentialsException;
import com.codearena.auth.exception.PasswordMismatchException;
import com.codearena.auth.exception.ResourceNotFoundException;
import com.codearena.auth.repository.UserRepository;
import com.codearena.auth.security.JwtService;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    private final Counter registerSuccessCounter;
    private final Counter registerFailureCounter;
    private final Counter loginSuccessCounter;
    private final Counter loginFailureCounter;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       MeterRegistry meterRegistry) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;

        this.registerSuccessCounter = Counter.builder("auth.register.success")
                .description("Number of successful user registrations")
                .register(meterRegistry);
        this.registerFailureCounter = Counter.builder("auth.register.failure")
                .description("Number of failed user registrations")
                .register(meterRegistry);
        this.loginSuccessCounter = Counter.builder("auth.login.success")
                .description("Number of successful user logins")
                .register(meterRegistry);
        this.loginFailureCounter = Counter.builder("auth.login.failure")
                .description("Number of failed user logins")
                .register(meterRegistry);
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        try {
            if (!request.getPassword().equals(request.getConfirmPassword())) {
                registerFailureCounter.increment();
                throw new PasswordMismatchException("Passwords do not match");
            }

            String username = request.getUsername().trim();
            String email = request.getEmail().trim().toLowerCase(Locale.ROOT);

            if (userRepository.existsByUsername(username)) {
                registerFailureCounter.increment();
                throw new DuplicateResourceException("Username is already taken");
            }

            if (userRepository.existsByEmail(email)) {
                registerFailureCounter.increment();
                throw new DuplicateResourceException("Email is already registered");
            }

            User user = User.builder()
                    .username(username)
                    .email(email)
                    .passwordHash(passwordEncoder.encode(request.getPassword()))
                    .createdAt(Instant.now())
                    .build();

            User savedUser = userRepository.save(user);
            registerSuccessCounter.increment();
            log.info("Registered user successfully with id: {}", savedUser.getId());
            return UserResponse.fromEntity(savedUser);
        } catch (DuplicateResourceException | PasswordMismatchException e) {
            throw e;
        } catch (Exception e) {
            registerFailureCounter.increment();
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public LoginResult login(LoginRequest request) {
        String identifier = request.getIdentifier().trim();
        Optional<User> userOptional;

        if (identifier.contains("@")) {
            userOptional = userRepository.findByEmail(identifier.toLowerCase(Locale.ROOT));
        } else {
            userOptional = userRepository.findByUsername(identifier);
        }

        if (userOptional.isEmpty()) {
            loginFailureCounter.increment();
            log.warn("Login failed: user not found for identifier: {}", identifier);
            throw new InvalidCredentialsException("Invalid credentials");
        }

        User user = userOptional.get();

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            loginFailureCounter.increment();
            log.warn("Login failed: password mismatch for user: {}", user.getUsername());
            throw new InvalidCredentialsException("Invalid credentials");
        }

        loginSuccessCounter.increment();
        String token = (user.getRole() != null && user.getRole() != Role.ROLE_USER)
                ? jwtService.generateToken(user.getId(), user.getUsername(), user.getRole().name())
                : jwtService.generateToken(user.getId(), user.getUsername());
        log.info("User {} logged in successfully", user.getUsername());

        return LoginResult.builder()
                .user(UserResponse.fromEntity(user))
                .token(token)
                .build();
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return UserResponse.fromEntity(user);
    }
}

