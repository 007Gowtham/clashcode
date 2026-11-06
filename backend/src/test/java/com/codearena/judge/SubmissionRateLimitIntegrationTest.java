package com.codearena.judge;

import com.codearena.auth.entity.Role;
import com.codearena.auth.entity.User;
import com.codearena.auth.repository.UserRepository;
import com.codearena.auth.security.JwtService;
import com.codearena.judge.domain.Submission;
import com.codearena.judge.domain.SubmissionMode;
import com.codearena.judge.domain.SubmissionStatus;
import com.codearena.judge.dto.CreateSubmissionRequest;
import com.codearena.judge.repository.SubmissionRepository;
import com.codearena.problem.domain.Problem;
import com.codearena.problem.domain.ProblemDifficulty;
import com.codearena.problem.domain.ProblemStatus;
import com.codearena.problem.domain.ProgrammingLanguage;
import com.codearena.problem.repository.ProblemRepository;
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

import java.time.Instant;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SubmissionRateLimitIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private SubmissionRepository submissionRepository;

    private User user;
    private String userToken;
    private Problem publishedProblem;

    @BeforeEach
    void setUp() {
        submissionRepository.deleteAll();
        problemRepository.deleteAll();
        userRepository.deleteAll();

        user = userRepository.save(User.builder()
                .username("speedy_coder")
                .email("speedy@test.com")
                .passwordHash("hashed")
                .role(Role.ROLE_USER)
                .createdAt(Instant.now())
                .build());

        userToken = jwtService.generateToken(user.getId(), user.getUsername(), "ROLE_USER");

        publishedProblem = problemRepository.save(Problem.builder()
                .title("Rate Limit Problem")
                .slug("rate-limit-problem")
                .statementMarkdown("Test rate limiting")
                .difficulty(ProblemDifficulty.EASY)
                .status(ProblemStatus.PUBLISHED)
                .createdBy(user.getId())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build());
    }

    @Test
    @DisplayName("Rate Limit: Second submission within 5 seconds is rejected with 429 Too Many Requests")
    void testRateLimitWithinFiveSeconds() throws Exception {
        CreateSubmissionRequest request = CreateSubmissionRequest.builder()
                .problemId(publishedProblem.getId())
                .language(ProgrammingLanguage.PYTHON)
                .sourceCode("print('fast')")
                .mode(SubmissionMode.RUN)
                .build();

        // 1. First submission succeeds (201 Created)
        mockMvc.perform(post("/submissions")
                        .cookie(new Cookie("access_token", userToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.status").value("PENDING"));

        // 2. Immediate second submission from same user is rejected (429)
        mockMvc.perform(post("/submissions")
                        .cookie(new Cookie("access_token", userToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.message").value("Please wait at least 5 seconds between submissions"));
    }

    @Test
    @DisplayName("Rule: Standalone submission to DRAFT problem is rejected with 400")
    void testCannotSubmitToDraftProblem() throws Exception {
        Problem draftProblem = problemRepository.save(Problem.builder()
                .title("Draft Problem")
                .slug("draft-problem")
                .statementMarkdown("Not published yet")
                .difficulty(ProblemDifficulty.MEDIUM)
                .status(ProblemStatus.DRAFT)
                .createdBy(user.getId())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build());

        CreateSubmissionRequest request = CreateSubmissionRequest.builder()
                .problemId(draftProblem.getId())
                .language(ProgrammingLanguage.PYTHON)
                .sourceCode("print('draft')")
                .mode(SubmissionMode.SUBMIT)
                .build();

        mockMvc.perform(post("/submissions")
                        .cookie(new Cookie("access_token", userToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Cannot submit to problem that is not PUBLISHED"));
    }
}

