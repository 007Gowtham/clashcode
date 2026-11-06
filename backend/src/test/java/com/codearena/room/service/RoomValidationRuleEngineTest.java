package com.codearena.room.service;

import com.codearena.room.domain.*;
import com.codearena.room.exception.*;
import com.codearena.room.repository.KickedUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RoomValidationRuleEngineTest {

    @Mock
    private KickedUserRepository kickedUserRepository;

    private RoomValidationRuleEngine ruleEngine;

    @BeforeEach
    void setUp() {
        ruleEngine = new RoomValidationRuleEngine(kickedUserRepository);
    }

    @Test
    @DisplayName("Join Room: Success when room is WAITING, user is not kicked, and capacity available")
    void joinRoom_Success() {
        UUID roomId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        Room room = Room.builder()
                .id(roomId)
                .roomCode("ABC123")
                .status(RoomStatus.WAITING)
                .maxPlayers(10)
                .build();

        when(kickedUserRepository.existsByRoomIdAndUserId(roomId, userId)).thenReturn(false);

        assertThatCode(() -> ruleEngine.validateCanJoinRoom(room, userId, 5))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Join Room: Reject when room status is STARTED or CLOSED")
    void joinRoom_RejectNonWaiting() {
        Room room = Room.builder()
                .status(RoomStatus.IN_PROGRESS)
                .maxPlayers(10)
                .build();

        assertThatThrownBy(() -> ruleEngine.validateCanJoinRoom(room, UUID.randomUUID(), 2))
                .isInstanceOf(IllegalRoomStateException.class)
                .hasMessageContaining("Room is not accepting new players");
    }

    @Test
    @DisplayName("Join Room: Reject when user is in kicked list")
    void joinRoom_RejectKickedUser() {
        UUID roomId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        Room room = Room.builder()
                .id(roomId)
                .roomCode("ROOM99")
                .status(RoomStatus.WAITING)
                .maxPlayers(10)
                .build();

        when(kickedUserRepository.existsByRoomIdAndUserId(roomId, userId)).thenReturn(true);

        assertThatThrownBy(() -> ruleEngine.validateCanJoinRoom(room, userId, 3))
                .isInstanceOf(UserKickedException.class)
                .hasMessageContaining("You have been kicked");
    }

    @Test
    @DisplayName("Join Room: Reject when room capacity is reached")
    void joinRoom_RejectFullRoom() {
        UUID roomId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        Room room = Room.builder()
                .id(roomId)
                .roomCode("ROOM16")
                .status(RoomStatus.WAITING)
                .maxPlayers(16)
                .build();

        when(kickedUserRepository.existsByRoomIdAndUserId(roomId, userId)).thenReturn(false);

        assertThatThrownBy(() -> ruleEngine.validateCanJoinRoom(room, userId, 16))
                .isInstanceOf(RoomFullException.class)
                .hasMessageContaining("reached maximum capacity");
    }

    @Test
    @DisplayName("Start Room SOLO: Success with at least 2 active players")
    void startRoom_SoloSuccess() {
        UUID adminId = UUID.randomUUID();
        Room room = Room.builder()
                .adminId(adminId)
                .status(RoomStatus.WAITING)
                .mode(RoomMode.SOLO)
                .build();

        List<RoomMember> members = List.of(
                RoomMember.builder().userId(adminId).build(),
                RoomMember.builder().userId(UUID.randomUUID()).build()
        );

        assertThatCode(() -> ruleEngine.validateCanStartRoom(room, adminId, List.of(), members))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Start Room SOLO: Reject with fewer than 2 active players")
    void startRoom_SoloFewerThanTwoPlayers() {
        UUID adminId = UUID.randomUUID();
        Room room = Room.builder()
                .adminId(adminId)
                .status(RoomStatus.WAITING)
                .mode(RoomMode.SOLO)
                .build();

        List<RoomMember> members = List.of(
                RoomMember.builder().userId(adminId).build()
        );

        assertThatThrownBy(() -> ruleEngine.validateCanStartRoom(room, adminId, List.of(), members))
                .isInstanceOf(RoomRuleViolationException.class)
                .hasMessageContaining("SOLO mode contest requires at least 2 active players");
    }

    @Test
    @DisplayName("Start Room: Reject when caller is not admin")
    void startRoom_RejectNonAdmin() {
        UUID adminId = UUID.randomUUID();
        UUID attackerId = UUID.randomUUID();
        Room room = Room.builder()
                .adminId(adminId)
                .status(RoomStatus.WAITING)
                .build();

        assertThatThrownBy(() -> ruleEngine.validateCanStartRoom(room, attackerId, List.of(), List.of()))
                .isInstanceOf(UnauthorizedRoomActionException.class)
                .hasMessageContaining("Only the room admin can start");
    }

    @Test
    @DisplayName("Start Room TEAM: Success when >= 2 teams and each team has exactly 4 members")
    void startRoom_TeamSuccess() {
        UUID adminId = UUID.randomUUID();
        Room room = Room.builder()
                .adminId(adminId)
                .status(RoomStatus.WAITING)
                .mode(RoomMode.TEAM)
                .build();

        List<Team> teams = List.of(
                Team.builder().name("Alpha").memberCount(4).build(),
                Team.builder().name("Beta").memberCount(4).build()
        );

        assertThatCode(() -> ruleEngine.validateCanStartRoom(room, adminId, teams, List.of()))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Start Room TEAM: Reject when fewer than 2 teams")
    void startRoom_TeamFewerThanTwoTeams() {
        UUID adminId = UUID.randomUUID();
        Room room = Room.builder()
                .adminId(adminId)
                .status(RoomStatus.WAITING)
                .mode(RoomMode.TEAM)
                .build();

        List<Team> teams = List.of(
                Team.builder().name("SoloTeam").memberCount(4).build()
        );

        assertThatThrownBy(() -> ruleEngine.validateCanStartRoom(room, adminId, teams, List.of()))
                .isInstanceOf(RoomRuleViolationException.class)
                .hasMessageContaining("requires at least 2 teams");
    }

    @Test
    @DisplayName("Start Room TEAM: Reject when any team does not have exactly 4 members")
    void startRoom_TeamIncompleteSize() {
        UUID adminId = UUID.randomUUID();
        Room room = Room.builder()
                .adminId(adminId)
                .status(RoomStatus.WAITING)
                .mode(RoomMode.TEAM)
                .build();

        List<Team> teams = List.of(
                Team.builder().name("FullTeam").memberCount(4).build(),
                Team.builder().name("UnderfilledTeam").memberCount(3).build()
        );

        assertThatThrownBy(() -> ruleEngine.validateCanStartRoom(room, adminId, teams, List.of()))
                .isInstanceOf(RoomRuleViolationException.class)
                .hasMessageContaining("Every team must have exactly 4 members");
    }

    @Test
    @DisplayName("Join Team: Reject when team already has 4 members")
    void joinTeam_RejectFullTeam() {
        Room room = Room.builder().mode(RoomMode.TEAM).status(RoomStatus.WAITING).build();
        Team team = Team.builder().name("Alpha").memberCount(4).build();
        RoomMember member = RoomMember.builder().status(MemberStatus.ACTIVE).teamId(null).build();

        assertThatThrownBy(() -> ruleEngine.validateCanJoinTeam(room, team, member))
                .isInstanceOf(TeamFullException.class)
                .hasMessageContaining("already full (maximum 4 members)");
    }

    @Test
    @DisplayName("Start Room TEAM: Collects all errors into RoomStartValidationException")
    void startRoom_TeamCollectsMultipleErrors() {
        UUID adminId = UUID.randomUUID();
        Room room = Room.builder()
                .adminId(adminId)
                .status(RoomStatus.WAITING)
                .mode(RoomMode.TEAM)
                .build();

        List<Team> teams = List.of(
                Team.builder().name("UnderfilledTeam").memberCount(2).build()
        );

        assertThatThrownBy(() -> ruleEngine.validateCanStartRoom(room, adminId, teams, List.of()))
                .isInstanceOf(RoomStartValidationException.class)
                .satisfies(ex -> {
                    RoomStartValidationException startEx = (RoomStartValidationException) ex;
                    org.assertj.core.api.Assertions.assertThat(startEx.getErrors()).hasSize(2);
                    org.assertj.core.api.Assertions.assertThat(startEx.getErrors().get(0)).contains("requires at least 2 teams");
                    org.assertj.core.api.Assertions.assertThat(startEx.getErrors().get(1)).contains("currently has 2/4 members");
                });
    }

    @Test
    @DisplayName("Create Team: Reject when room maxTeams limit reached")
    void createTeam_RejectMaxTeamsReached() {
        Room room = Room.builder()
                .mode(RoomMode.TEAM)
                .status(RoomStatus.WAITING)
                .maxTeams(2)
                .build();
        RoomMember member = RoomMember.builder().status(MemberStatus.ACTIVE).teamId(null).build();

        assertThatThrownBy(() -> ruleEngine.validateCanCreateTeam(room, member, 2))
                .isInstanceOf(RoomRuleViolationException.class)
                .hasMessageContaining("Maximum number of teams (2) has been reached");
    }

    @Test
    @DisplayName("Join Team: Reject when caller is leader of another team")
    void joinTeam_RejectLeaderSwitchingTeams() {
        Room room = Room.builder().mode(RoomMode.TEAM).status(RoomStatus.WAITING).build();
        Team targetTeam = Team.builder().id(UUID.randomUUID()).name("TargetTeam").memberCount(2).build();
        RoomMember leader = RoomMember.builder()
                .status(MemberStatus.ACTIVE)
                .teamId(UUID.randomUUID())
                .role(MemberRole.LEADER)
                .build();

        assertThatThrownBy(() -> ruleEngine.validateCanJoinTeam(room, targetTeam, leader))
                .isInstanceOf(RoomRuleViolationException.class)
                .hasMessageContaining("Team leaders cannot switch teams");
    }

    @Test
    @DisplayName("Kick From Team: Reject when kicker is not team leader")
    void kickFromTeam_RejectNonLeader() {
        Room room = Room.builder().status(RoomStatus.WAITING).adminId(UUID.randomUUID()).build();
        Team team = Team.builder().leaderId(UUID.randomUUID()).build();
        UUID otherMemberId = UUID.randomUUID();

        assertThatThrownBy(() -> ruleEngine.validateCanKickFromTeam(room, team, otherMemberId, UUID.randomUUID()))
                .isInstanceOf(UnauthorizedRoomActionException.class)
                .hasMessageContaining("Only the team leader can kick members");
    }

    @Test
    @DisplayName("Kick From Team: Reject when leader attempts to kick room admin")
    void kickFromTeam_RejectLeaderKickingRoomAdmin() {
        UUID adminId = UUID.randomUUID();
        UUID leaderId = UUID.randomUUID();
        Room room = Room.builder().status(RoomStatus.WAITING).adminId(adminId).build();
        Team team = Team.builder().leaderId(leaderId).build();

        assertThatThrownBy(() -> ruleEngine.validateCanKickFromTeam(room, team, leaderId, adminId))
                .isInstanceOf(UnauthorizedRoomActionException.class)
                .hasMessageContaining("Team leaders cannot kick the room admin");
    }

    @Test
    @DisplayName("Kick: Reject when user attempts to kick themselves")
    void kick_RejectSelfKick() {
        UUID userId = UUID.randomUUID();
        Room room = Room.builder().status(RoomStatus.WAITING).build();

        assertThatThrownBy(() -> ruleEngine.validateCanKick(room, userId, userId))
                .isInstanceOf(RoomRuleViolationException.class)
                .hasMessageContaining("You cannot kick yourself");
    }
}

