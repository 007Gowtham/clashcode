package com.codearena.problem;

import com.codearena.auth.entity.Role;
import com.codearena.auth.entity.User;
import com.codearena.auth.repository.UserRepository;
import com.codearena.auth.security.JwtService;
import com.codearena.problem.domain.*;
import com.codearena.problem.dto.SelectRoomProblemsRequest;
import com.codearena.problem.dto.UpdateProblemRequest;
import com.codearena.problem.repository.ContestProblemRepository;
import com.codearena.problem.repository.ProblemRepository;
import com.codearena.problem.repository.StarterCodeRepository;
import com.codearena.problem.repository.TestCaseRepository;
import com.codearena.problem.service.AdminProblemService;
import com.codearena.problem.service.ContestProblemService;
import com.codearena.room.domain.MemberRole;
import com.codearena.room.domain.MemberStatus;
import com.codearena.room.domain.Room;
import com.codearena.room.domain.RoomMember;
import com.codearena.room.domain.RoomMode;
import com.codearena.room.domain.RoomStatus;
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
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ContestProblemFreezeIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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
    private AdminProblemService adminProblemService;

    private User adminUser;
    private User playerUser;
    private String adminToken;
    private String playerToken;
    private Problem catalogProblem;
    private Room room;

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
                .username("chief_admin")
                .email("chief@codearena.com")
                .passwordHash("hashed")
                .role(Role.ROLE_ADMIN)
                .createdAt(Instant.now())
                .build());

        playerUser = userRepository.save(User.builder()
                .username("contestant_bob")
                .email("bob@codearena.com")
                .passwordHash("hashed")
                .role(Role.ROLE_USER)
                .createdAt(Instant.now())
                .build());

        adminToken = jwtService.generateToken(adminUser.getId(), adminUser.getUsername(), "ROLE_ADMIN");
        playerToken = jwtService.generateToken(playerUser.getId(), playerUser.getUsername(), "ROLE_USER");

        catalogProblem = problemRepository.save(Problem.builder()
                .title("Initial Original Title")
                .slug("initial-original-title")
                .statementMarkdown("Original Statement: Solve in O(n)")
                .difficulty(ProblemDifficulty.MEDIUM)
                .tags(Set.of("dp"))
                .timeLimitMs(1500)
                .memoryLimitMb(128)
                .points(200)
                .createdBy(adminUser.getId())
                .status(ProblemStatus.PUBLISHED)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build());

        testCaseRepository.save(TestCase.builder()
                .problemId(catalogProblem.getId())
                .input("original input")
                .expectedOutput("original output")
                .isSample(true)
                .orderIndex(1)
                .build());

        testCaseRepository.save(TestCase.builder()
                .problemId(catalogProblem.getId())
                .input("hidden 1")
                .expectedOutput("hidden 1")
                .isSample(false)
                .orderIndex(2)
                .build());

        testCaseRepository.save(TestCase.builder()
                .problemId(catalogProblem.getId())
                .input("hidden 2")
                .expectedOutput("hidden 2")
                .isSample(false)
                .orderIndex(3)
                .build());

        room = roomRepository.save(Room.builder()
                .roomCode("FREEZE")
                .adminId(adminUser.getId())
                .mode(RoomMode.SOLO)
                .status(RoomStatus.WAITING)
                .maxPlayers(10)
                .version(1L)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build());

        roomMemberRepository.save(RoomMember.builder()
                .roomId(room.getId())
                .userId(playerUser.getId())
                .role(MemberRole.MEMBER)
                .status(MemberStatus.ACTIVE)
                .joinedAt(Instant.now())
                .build());
    }

    @Test
    @DisplayName("Freeze Rule: Editing a problem mid-contest does NOT change the active contest snapshot")
    void testMidContestProblemEditsDoNotAffectActiveContest() throws Exception {
        // 1. In WAITING state, admin selects problem
        SelectRoomProblemsRequest selectRequest = SelectRoomProblemsRequest.builder()
                .problemIds(List.of(catalogProblem.getId()))
                .build();

        mockMvc.perform(post("/rooms/" + room.getId() + "/problems")
                        .cookie(new Cookie("access_token", adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(selectRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title").value("Initial Original Title"));

        // 2. Before contest start, GET /rooms/{roomId}/problems is blocked
        mockMvc.perform(get("/rooms/" + room.getId() + "/problems")
                        .cookie(new Cookie("access_token", playerToken)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Contest has not started yet. Contest problems are hidden until contest start."));

        // 3. Start the contest -> Freeze contest problems
        room.setStatus(RoomStatus.IN_PROGRESS);
        roomRepository.save(room);
        contestProblemService.freezeProblemsForRoom(room.getId());

        // 4. In STARTED state, selecting problems is now BLOCKED
        mockMvc.perform(post("/rooms/" + room.getId() + "/problems")
                        .cookie(new Cookie("access_token", adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(selectRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Problems can only be selected while room is in WAITING state"));

        // 5. Admin updates the catalog problem mid-contest
        UpdateProblemRequest updateRequest = UpdateProblemRequest.builder()
                .title("ALTERED MID CONTEST TITLE")
                .statementMarkdown("Altered statement completely changed!")
                .difficulty(ProblemDifficulty.HARD)
                .tags(Set.of("graph"))
                .timeLimitMs(5000)
                .memoryLimitMb(512)
                .points(500)
                .build();

        mockMvc.perform(put("/admin/problems/" + catalogProblem.getId())
                        .cookie(new Cookie("access_token", adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("ALTERED MID CONTEST TITLE"));

        // 6. Player retrieves contest problems -> MUST STILL SEE ORIGINAL FROZEN SNAPSHOT!
        mockMvc.perform(get("/rooms/" + room.getId() + "/problems")
                        .cookie(new Cookie("access_token", playerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title").value("Initial Original Title"))
                .andExpect(jsonPath("$[0].statementMarkdown").value("Original Statement: Solve in O(n)"))
                .andExpect(jsonPath("$[0].difficulty").value("MEDIUM"))
                .andExpect(jsonPath("$[0].timeLimitMs").value(1500))
                .andExpect(jsonPath("$[0].memoryLimitMb").value(128))
                .andExpect(jsonPath("$[0].points").value(200));
    }
}

