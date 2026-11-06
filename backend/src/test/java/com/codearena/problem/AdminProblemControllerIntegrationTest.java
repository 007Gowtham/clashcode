package com.codearena.problem;

import com.codearena.auth.entity.Role;
import com.codearena.auth.entity.User;
import com.codearena.auth.repository.UserRepository;
import com.codearena.auth.security.JwtService;
import com.codearena.problem.domain.ProblemDifficulty;
import com.codearena.problem.dto.CreateProblemRequest;
import com.codearena.problem.dto.CreateTestCaseRequest;
import com.codearena.problem.repository.ContestProblemRepository;
import com.codearena.problem.repository.ProblemRepository;
import com.codearena.problem.repository.StarterCodeRepository;
import com.codearena.problem.repository.TestCaseRepository;
import com.codearena.room.repository.RoomMemberRepository;
import com.codearena.room.repository.RoomRepository;
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
import java.util.Set;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AdminProblemControllerIntegrationTest {

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
    private TestCaseRepository testCaseRepository;

    @Autowired
    private StarterCodeRepository starterCodeRepository;

    @Autowired
    private ContestProblemRepository contestProblemRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomMemberRepository roomMemberRepository;

    private User adminUser;
    private User normalUser;
    private String adminToken;
    private String userToken;

    @BeforeEach
    void setUp() {
        contestProblemRepository.deleteAll();
        roomMemberRepository.deleteAll();
        roomRepository.deleteAll();
        testCaseRepository.deleteAll();
        starterCodeRepository.deleteAll();
        problemRepository.deleteAll();
        userRepository.deleteAll();

        adminUser = userRepository.save(User.builder()
                .username("sys_admin")
                .email("sysadmin@test.com")
                .passwordHash("hashed")
                .role(Role.ROLE_ADMIN)
                .createdAt(Instant.now())
                .build());

        normalUser = userRepository.save(User.builder()
                .username("plain_user")
                .email("plain@test.com")
                .passwordHash("hashed")
                .role(Role.ROLE_USER)
                .createdAt(Instant.now())
                .build());

        adminToken = jwtService.generateToken(adminUser.getId(), adminUser.getUsername(), "ROLE_ADMIN");
        userToken = jwtService.generateToken(normalUser.getId(), normalUser.getUsername(), "ROLE_USER");
    }

    @Test
    @DisplayName("Security: Non-admin user cannot access /admin/problems (returns 403)")
    void testNonAdminCannotAccessAdminEndpoints() throws Exception {
        CreateProblemRequest request = CreateProblemRequest.builder()
                .title("Unauthorized Problem")
                .statementMarkdown("Should fail")
                .difficulty(ProblemDifficulty.EASY)
                .build();

        mockMvc.perform(post("/admin/problems")
                        .cookie(new Cookie("access_token", userToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Admin CRUD lifecycle: Create draft problem, add test cases, and publish")
    void testAdminProblemLifecycle() throws Exception {
        // 1. Admin creates problem in DRAFT
        CreateProblemRequest createRequest = CreateProblemRequest.builder()
                .title("Fibonacci Number")
                .slug("fibonacci-number")
                .statementMarkdown("Compute F(n)")
                .difficulty(ProblemDifficulty.EASY)
                .tags(Set.of("math", "dp"))
                .timeLimitMs(1000)
                .memoryLimitMb(128)
                .points(50)
                .build();

        String createResponseBody = mockMvc.perform(post("/admin/problems")
                        .cookie(new Cookie("access_token", adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.slug").value("fibonacci-number"))
                .andReturn().getResponse().getContentAsString();

        String problemId = objectMapper.readTree(createResponseBody).get("id").asText();

        // 2. Attempt to publish prematurely (fails because 0 test cases exist)
        mockMvc.perform(post("/admin/problems/" + problemId + "/publish")
                        .cookie(new Cookie("access_token", adminToken)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Must have at least 1 sample test case")));

        // 3. Add 1 sample testcase and 2 hidden testcases
        CreateTestCaseRequest sampleCase = CreateTestCaseRequest.builder()
                .input("n = 2")
                .expectedOutput("1")
                .isSample(true)
                .orderIndex(1)
                .build();

        mockMvc.perform(post("/admin/problems/" + problemId + "/testcases")
                        .cookie(new Cookie("access_token", adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleCase)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.isSample").value(true));

        CreateTestCaseRequest hiddenCase1 = CreateTestCaseRequest.builder()
                .input("n = 3")
                .expectedOutput("2")
                .isSample(false)
                .orderIndex(2)
                .build();

        mockMvc.perform(post("/admin/problems/" + problemId + "/testcases")
                        .cookie(new Cookie("access_token", adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(hiddenCase1)))
                .andExpect(status().isCreated());

        CreateTestCaseRequest hiddenCase2 = CreateTestCaseRequest.builder()
                .input("n = 4")
                .expectedOutput("3")
                .isSample(false)
                .orderIndex(3)
                .build();

        mockMvc.perform(post("/admin/problems/" + problemId + "/testcases")
                        .cookie(new Cookie("access_token", adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(hiddenCase2)))
                .andExpect(status().isCreated());

        // 4. Publish problem (now succeeds with 1 sample + 2 hidden = 3 total)
        mockMvc.perform(post("/admin/problems/" + problemId + "/publish")
                        .cookie(new Cookie("access_token", adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"))
                .andExpect(jsonPath("$.sampleTestCasesCount").value(1))
                .andExpect(jsonPath("$.totalTestCasesCount").value(3));

        // 5. Now player can see it in public catalog
        mockMvc.perform(get("/problems")
                        .cookie(new Cookie("access_token", userToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(greaterThanOrEqualTo(1))));
    }
}

