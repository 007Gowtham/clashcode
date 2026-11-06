package com.codearena.problem;

import com.codearena.auth.entity.Role;
import com.codearena.auth.entity.User;
import com.codearena.auth.repository.UserRepository;
import com.codearena.auth.security.JwtService;
import com.codearena.problem.domain.*;
import com.codearena.problem.dto.SelectRoomProblemsRequest;
import com.codearena.problem.repository.ContestProblemRepository;
import com.codearena.problem.repository.ProblemRepository;
import com.codearena.problem.repository.StarterCodeRepository;
import com.codearena.problem.repository.TestCaseRepository;
import com.codearena.problem.service.ContestProblemService;
import com.codearena.room.domain.MemberRole;
import com.codearena.room.domain.MemberStatus;
import com.codearena.room.domain.Room;
import com.codearena.room.domain.RoomMember;
import com.codearena.room.domain.RoomMode;
import com.codearena.room.domain.RoomStatus;
import com.codearena.room.repository.RoomMemberRepository;
import com.codearena.room.repository.RoomRepository;
import com.codearena.room.service.RoomService;
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

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ProblemVisibilityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

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

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ContestProblemService contestProblemService;

    @Autowired
    private RoomService roomService;

    private static final String SAMPLE_OUTPUT_SECRET = "VISIBLE_SAMPLE_OUTPUT_42";
    private static final String HIDDEN_OUTPUT_SECRET = "TOP_SECRET_HIDDEN_OUTPUT_99999";
    private static final String HIDDEN_INPUT_SECRET = "CONFIDENTIAL_HIDDEN_INPUT_88888";

    private Problem publishedProblem;
    private User playerUser;
    private User adminUser;
    private String playerToken;

    @BeforeEach
    void setUp() {
        contestProblemRepository.deleteAll();
        roomMemberRepository.deleteAll();
        roomRepository.deleteAll();
        testCaseRepository.deleteAll();
        starterCodeRepository.deleteAll();
        problemRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Create player and admin
        playerUser = userRepository.save(User.builder()
                .username("code_challenger")
                .email("challenger@test.com")
                .passwordHash("hashed")
                .role(Role.ROLE_USER)
                .createdAt(Instant.now())
                .build());

        adminUser = userRepository.save(User.builder()
                .username("arena_admin")
                .email("admin@test.com")
                .passwordHash("hashed")
                .role(Role.ROLE_ADMIN)
                .createdAt(Instant.now())
                .build());

        playerToken = jwtService.generateToken(playerUser.getId(), playerUser.getUsername(), "ROLE_USER");

        // 2. Create and publish a test problem
        publishedProblem = problemRepository.save(Problem.builder()
                .title("Visibility Security Problem")
                .slug("visibility-security-problem")
                .statementMarkdown("Demonstrating that hidden testcases never leak.")
                .difficulty(ProblemDifficulty.MEDIUM)
                .tags(Set.of("security", "algorithms"))
                .timeLimitMs(2000)
                .memoryLimitMb(256)
                .points(150)
                .createdBy(adminUser.getId())
                .status(ProblemStatus.PUBLISHED)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build());

        // Sample testcase (visible to players)
        testCaseRepository.save(TestCase.builder()
                .problemId(publishedProblem.getId())
                .input("sample input 1")
                .expectedOutput(SAMPLE_OUTPUT_SECRET)
                .isSample(true)
                .orderIndex(1)
                .build());

        // Hidden testcases (MUST NEVER LEAK TO PLAYERS)
        testCaseRepository.save(TestCase.builder()
                .problemId(publishedProblem.getId())
                .input(HIDDEN_INPUT_SECRET)
                .expectedOutput(HIDDEN_OUTPUT_SECRET)
                .isSample(false)
                .orderIndex(2)
                .build());

        testCaseRepository.save(TestCase.builder()
                .problemId(publishedProblem.getId())
                .input("hidden input 2")
                .expectedOutput("HIDDEN_OUTPUT_2")
                .isSample(false)
                .orderIndex(3)
                .build());
    }

    @Test
    @DisplayName("Security: Player GET /problems/{slug} strictly returns samples and NEVER leaks hidden cases")
    void testPlayerProblemEndpointNeverLeaksHiddenCases() throws Exception {
        MvcResult result = mockMvc.perform(get("/problems/" + publishedProblem.getSlug())
                        .cookie(new Cookie("access_token", playerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slug").value(publishedProblem.getSlug()))
                .andExpect(jsonPath("$.sampleTestCases", hasSize(1)))
                .andExpect(jsonPath("$.sampleTestCases[0].expectedOutput").value(SAMPLE_OUTPUT_SECRET))
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();

        // Strict verification: hidden tokens must not appear anywhere in the HTTP response
        assertThat(responseBody).contains(SAMPLE_OUTPUT_SECRET);
        assertThat(responseBody).doesNotContain(HIDDEN_OUTPUT_SECRET);
        assertThat(responseBody).doesNotContain(HIDDEN_INPUT_SECRET);
        assertThat(responseBody).doesNotContain("HIDDEN_OUTPUT_2");
    }

    @Test
    @DisplayName("Security: Room Contest GET /rooms/{roomId}/problems strictly returns samples and NEVER leaks hidden cases")
    void testRoomContestEndpointNeverLeaksHiddenCases() throws Exception {
        // 1. Create a Room in WAITING state
        Room room = roomRepository.save(Room.builder()
                .roomCode("CONSEC")
                .adminId(adminUser.getId())
                .mode(RoomMode.SOLO)
                .status(RoomStatus.WAITING)
                .maxPlayers(10)
                .version(1L)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build());

        // Player is active member
        roomMemberRepository.save(RoomMember.builder()
                .roomId(room.getId())
                .userId(playerUser.getId())
                .role(MemberRole.MEMBER)
                .status(MemberStatus.ACTIVE)
                .joinedAt(Instant.now())
                .build());

        // Admin selects the problem for the room contest
        contestProblemService.selectProblemsForRoom(room.getId(),
                SelectRoomProblemsRequest.builder().problemIds(List.of(publishedProblem.getId())).build(),
                adminUser.getId());

        // 2. Room contest starts (freeze happens)
        room.setStatus(RoomStatus.IN_PROGRESS);
        roomRepository.save(room);
        contestProblemService.freezeProblemsForRoom(room.getId());

        // 3. Player requests contest problems
        MvcResult result = mockMvc.perform(get("/rooms/" + room.getId() + "/problems")
                        .cookie(new Cookie("access_token", playerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].sampleTestCases", hasSize(1)))
                .andExpect(jsonPath("$[0].sampleTestCases[0].expectedOutput").value(SAMPLE_OUTPUT_SECRET))
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();

        // Strict verification
        assertThat(responseBody).contains(SAMPLE_OUTPUT_SECRET);
        assertThat(responseBody).doesNotContain(HIDDEN_OUTPUT_SECRET);
        assertThat(responseBody).doesNotContain(HIDDEN_INPUT_SECRET);
        assertThat(responseBody).doesNotContain("HIDDEN_OUTPUT_2");
    }
}

