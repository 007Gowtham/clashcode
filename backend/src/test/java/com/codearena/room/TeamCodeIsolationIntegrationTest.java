package com.codearena.room;

import com.codearena.auth.entity.User;
import com.codearena.auth.repository.UserRepository;
import com.codearena.room.domain.*;
import com.codearena.room.dto.*;
import com.codearena.room.exception.InvalidTeamCodeException;
import com.codearena.room.repository.RoomMemberRepository;
import com.codearena.room.repository.RoomRepository;
import com.codearena.room.repository.TeamRepository;
import com.codearena.room.service.RoomService;
import com.codearena.room.service.TeamService;
import com.codearena.judge.exception.RateLimitExceededException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
class TeamCodeIsolationIntegrationTest {

    @Autowired
    private RoomService roomService;

    @Autowired
    private TeamService teamService;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private RoomMemberRepository roomMemberRepository;

    @Autowired
    private UserRepository userRepository;

    private User admin;
    private User player2;
    private User player3;

    @BeforeEach
    void setUp() {
        roomMemberRepository.deleteAll();
        teamRepository.deleteAll();
        roomRepository.deleteAll();
        userRepository.deleteAll();

        admin = userRepository.save(User.builder()
                .id(UUID.randomUUID())
                .username("team_admin")
                .email("admin@test.io")
                .passwordHash("hashed")
                .createdAt(Instant.now())
                .build());

        player2 = userRepository.save(User.builder()
                .id(UUID.randomUUID())
                .username("player_two")
                .email("p2@test.io")
                .passwordHash("hashed")
                .createdAt(Instant.now())
                .build());

        player3 = userRepository.save(User.builder()
                .id(UUID.randomUUID())
                .username("player_three")
                .email("p3@test.io")
                .passwordHash("hashed")
                .createdAt(Instant.now())
                .build());
    }

    @Test
    @DisplayName("Team Code Privacy: Snapshot reveals teamCode only to that team's members, hiding it from other players")
    void testTeamCodeHiddenFromNonMembers() {
        // 1. Admin creates TEAM room
        RoomSnapshotDto roomSnap = roomService.createRoom(
                CreateRoomRequest.builder()
                        .roomName("Isolation Arena")
                        .mode(RoomMode.TEAM)
                        .maxTeams(4)
                        .build(),
                admin.getId()
        );
        String roomCode = roomSnap.getRoom().getRoomCode();

        // 2. Player 2 and Player 3 join room
        roomService.joinRoom(JoinRoomRequest.builder().roomCode(roomCode).build(), player2.getId());
        roomService.joinRoom(JoinRoomRequest.builder().roomCode(roomCode).build(), player3.getId());

        // 3. Admin creates Team Alpha
        TeamDto alphaTeam = teamService.createTeam(roomCode, CreateTeamRequest.builder().teamName("Alpha").build(), admin.getId());
        assertThat(alphaTeam.getCode()).isNotNull();

        // 4. Player 2 creates Team Beta
        TeamDto betaTeam = teamService.createTeam(roomCode, CreateTeamRequest.builder().teamName("Beta").build(), player2.getId());
        assertThat(betaTeam.getCode()).isNotNull();

        // 5. Check snapshot as Admin (member of Alpha):
        // Admin must see Alpha's code, but Beta's code must be null
        RoomSnapshotDto adminView = roomService.getRoomSnapshot(roomCode, admin.getId());
        TeamDto alphaForAdmin = adminView.getTeams().stream().filter(t -> t.getName().equals("Alpha")).findFirst().orElseThrow();
        TeamDto betaForAdmin = adminView.getTeams().stream().filter(t -> t.getName().equals("Beta")).findFirst().orElseThrow();

        assertThat(alphaForAdmin.getCode()).isEqualTo(alphaTeam.getCode());
        assertThat(betaForAdmin.getCode()).isNull();

        // 6. Check snapshot as Player 3 (unassigned player):
        // Both Alpha and Beta codes must be null
        RoomSnapshotDto p3View = roomService.getRoomSnapshot(roomCode, player3.getId());
        TeamDto alphaForP3 = p3View.getTeams().stream().filter(t -> t.getName().equals("Alpha")).findFirst().orElseThrow();
        TeamDto betaForP3 = p3View.getTeams().stream().filter(t -> t.getName().equals("Beta")).findFirst().orElseThrow();

        assertThat(alphaForP3.getCode()).isNull();
        assertThat(betaForP3.getCode()).isNull();
    }

    @Test
    @DisplayName("Team Code Isolation: Joining with code from another room or invalid code is rejected")
    void testCodeFromAnotherRoomFails() {
        // Room 1 with Team 1
        RoomSnapshotDto room1Snap = roomService.createRoom(
                CreateRoomRequest.builder().roomName("Room 1").mode(RoomMode.TEAM).build(),
                admin.getId()
        );
        TeamDto team1 = teamService.createTeam(room1Snap.getRoom().getRoomCode(), CreateTeamRequest.builder().teamName("Team 1").build(), admin.getId());

        // Room 2 with Player 2
        RoomSnapshotDto room2Snap = roomService.createRoom(
                CreateRoomRequest.builder().roomName("Room 2").mode(RoomMode.TEAM).build(),
                player2.getId()
        );
        roomService.joinRoom(JoinRoomRequest.builder().roomCode(room2Snap.getRoom().getRoomCode()).build(), player3.getId());

        // Player 3 tries to join Team 1's code inside Room 2 -> Must fail with InvalidTeamCodeException
        assertThatThrownBy(() -> teamService.joinTeam(
                room2Snap.getRoom().getRoomCode(),
                JoinTeamRequest.builder().teamCode(team1.getCode()).build(),
                player3.getId()
        ))
        .isInstanceOf(InvalidTeamCodeException.class)
        .hasMessageContaining("Invalid team code for this room");
    }

    @Test
    @DisplayName("Rate Limiting: Exceeding 5 failed code attempts blocks user with RateLimitExceededException")
    void testRateLimitOnFailedAttempts() {
        RoomSnapshotDto roomSnap = roomService.createRoom(
                CreateRoomRequest.builder().roomName("Guessing Defense Arena").mode(RoomMode.TEAM).build(),
                admin.getId()
        );
        String roomCode = roomSnap.getRoom().getRoomCode();
        roomService.joinRoom(JoinRoomRequest.builder().roomCode(roomCode).build(), player2.getId());

        // Attempt 1 to 5: all fail with InvalidTeamCodeException
        for (int i = 1; i <= 5; i++) {
            final String fakeCode = "FAKE" + i;
            assertThatThrownBy(() -> teamService.joinTeam(
                    roomCode,
                    JoinTeamRequest.builder().teamCode(fakeCode).build(),
                    player2.getId()
            )).isInstanceOf(InvalidTeamCodeException.class);
        }

        // Attempt 6: Rate limit must trigger immediately
        assertThatThrownBy(() -> teamService.joinTeam(
                roomCode,
                JoinTeamRequest.builder().teamCode("FAKE6").build(),
                player2.getId()
        ))
        .isInstanceOf(RateLimitExceededException.class)
        .hasMessageContaining("Too many failed code attempts");
    }
}

