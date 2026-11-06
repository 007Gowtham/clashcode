package com.codearena.room;

import com.codearena.auth.dto.RegisterRequest;
import com.codearena.auth.repository.UserRepository;
import com.codearena.auth.security.JwtService;
import com.codearena.room.domain.RoomMode;
import com.codearena.room.domain.RoomStatus;
import com.codearena.room.dto.CreateRoomRequest;
import com.codearena.room.dto.CreateTeamRequest;
import com.codearena.room.dto.JoinRoomRequest;
import com.codearena.room.dto.JoinTeamRequest;
import com.codearena.room.repository.RoomMemberRepository;
import com.codearena.room.repository.RoomRepository;
import com.codearena.room.repository.TeamRepository;
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

import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class RoomControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private RoomMemberRepository roomMemberRepository;

    @BeforeEach
    void setUp() {
        roomMemberRepository.deleteAll();
        teamRepository.deleteAll();
        roomRepository.deleteAll();
        userRepository.deleteAll();
    }

    private Cookie createAuthCookie(String username, String email) throws Exception {
        RegisterRequest register = RegisterRequest.builder()
                .username(username)
                .email(email)
                .password("Password123")
                .confirmPassword("Password123")
                .build();

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated())
                .andReturn();

        UUID userId = UUID.fromString(objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText());
        String token = jwtService.generateToken(userId, username);
        return new Cookie("access_token", token);
    }

    @Test
    @DisplayName("REST: Create room, join room, create team, join team, and get snapshot")
    void testRoomAndTeamWorkflow() throws Exception {
        Cookie adminCookie = createAuthCookie("contest_admin", "admin@clashcode.io");
        Cookie player2Cookie = createAuthCookie("player_two", "player2@clashcode.io");

        // 1. Admin creates a TEAM room
        CreateRoomRequest createReq = CreateRoomRequest.builder()
                .roomName("Contest Test Room")
                .mode(RoomMode.TEAM)
                .maxPlayers(16)
                .build();

        MvcResult createResult = mockMvc.perform(post("/rooms")
                        .cookie(adminCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.room.roomCode").isNotEmpty())
                .andExpect(jsonPath("$.room.mode").value("TEAM"))
                .andExpect(jsonPath("$.room.status").value("WAITING"))
                .andReturn();

        String roomCode = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("room").get("roomCode").asText();
        String roomIdStr = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("room").get("id").asText();
        UUID roomId = UUID.fromString(roomIdStr);

        // 2. Player 2 joins the room
        JoinRoomRequest joinRoomReq = JoinRoomRequest.builder().roomCode(roomCode).build();
        mockMvc.perform(post("/rooms/join")
                        .cookie(player2Cookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(joinRoomReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.members", hasSize(2)));

        // 3. Player 2 creates a team "BinaryBeasts"
        CreateTeamRequest teamReq = CreateTeamRequest.builder().name("BinaryBeasts").build();
        MvcResult teamResult = mockMvc.perform(post("/rooms/" + roomId + "/teams")
                        .cookie(player2Cookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(teamReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("BinaryBeasts"))
                .andExpect(jsonPath("$.code").isNotEmpty())
                .andExpect(jsonPath("$.memberCount").value(1))
                .andReturn();

        String teamCode = objectMapper.readTree(teamResult.getResponse().getContentAsString()).get("code").asText();

        // 4. Admin joins the team
        JoinTeamRequest joinTeamReq = JoinTeamRequest.builder().teamCode(teamCode).build();
        mockMvc.perform(post("/rooms/" + roomId + "/teams/join")
                        .cookie(adminCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(joinTeamReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.memberCount").value(2));

        // 5. Get room snapshot
        mockMvc.perform(get("/rooms/" + roomId)
                        .cookie(adminCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.room.id").value(roomIdStr))
                .andExpect(jsonPath("$.teams", hasSize(1)))
                .andExpect(jsonPath("$.teams[0].memberCount").value(2))
                .andExpect(jsonPath("$.unassignedPlayers", hasSize(0)));
    }
}

