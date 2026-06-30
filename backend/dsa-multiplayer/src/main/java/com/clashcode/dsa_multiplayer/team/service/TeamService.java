package com.clashcode.dsa_multiplayer.team.service;

import com.clashcode.dsa_multiplayer.auth.entity.User;
import com.clashcode.dsa_multiplayer.auth.repository.UserRepository;
import com.clashcode.dsa_multiplayer.common.exception.ApiException;
import com.clashcode.dsa_multiplayer.room.entity.Room;
import com.clashcode.dsa_multiplayer.room.entity.RoomStatus;
import com.clashcode.dsa_multiplayer.room.repository.RoomRepository;
import com.clashcode.dsa_multiplayer.team.dto.CreateTeamRequest;
import com.clashcode.dsa_multiplayer.team.dto.JoinTeamRequest;
import com.clashcode.dsa_multiplayer.team.dto.TeamMemberResponse;
import com.clashcode.dsa_multiplayer.team.dto.TeamResponse;
import com.clashcode.dsa_multiplayer.team.entity.Team;
import com.clashcode.dsa_multiplayer.team.entity.TeamMember;
import com.clashcode.dsa_multiplayer.team.repository.TeamMemberRepository;
import com.clashcode.dsa_multiplayer.team.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
<<<<<<< HEAD
=======
    private final com.clashcode.dsa_multiplayer.common.service.WebSocketService webSocketService;
>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7

    @Transactional
    public TeamResponse createTeam(CreateTeamRequest request, User leader) {
        User currentLeader = userRepository.findById(leader.getId())
                .orElseThrow(() -> new ApiException("USER_NOT_FOUND: User not found", HttpStatus.NOT_FOUND));

        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new ApiException("ROOM_NOT_FOUND: Room not found", HttpStatus.NOT_FOUND));

        if (room.getStatus() != RoomStatus.WAITING) {
            throw new ApiException("ROOM_NOT_AVAILABLE: Room is not available (already started or ended)", HttpStatus.BAD_REQUEST);
        }

        removeStaleMembershipOrReject(currentLeader, room);

        int maxSize = request.getMaxSize() > 0 ? request.getMaxSize() : room.getMaxTeamSize();

        String code = generateUniqueCode();
        Team team = Team.builder()
                .code(code)
                .name(request.getName())
                .room(room)
                .leader(currentLeader)
                .maxSize(maxSize)
                .score(0)
                .isReady(false)
                .build();

        team = teamRepository.save(team);

        TeamMember member = TeamMember.builder()
                .team(team)
                .user(currentLeader)
                .isReady(false)
                .build();

        teamMemberRepository.save(member);

        currentLeader.setCurrentTeamId(team.getId());
        userRepository.save(currentLeader);

        log.info("Team created: {} with code {} inside room {}", team.getName(), team.getCode(), room.getCode());
<<<<<<< HEAD
=======
        webSocketService.push("/topic/room/" + room.getId() + "/events", java.util.Map.of("type", "LOBBY_UPDATE"));
>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7
        return convertToTeamResponse(team);
    }

    @Transactional
    public TeamResponse joinTeamByCode(JoinTeamRequest request, User user) {
        User currentUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new ApiException("USER_NOT_FOUND: User not found", HttpStatus.NOT_FOUND));

        Team team = teamRepository.findByCode(request.getCode().toUpperCase())
                .orElseThrow(() -> new ApiException("TEAM_NOT_FOUND: Team not found", HttpStatus.NOT_FOUND));

        Room room = team.getRoom();
        if (room.getStatus() != RoomStatus.WAITING) {
            throw new ApiException("ROOM_NOT_AVAILABLE: Room is not available", HttpStatus.BAD_REQUEST);
        }

        removeStaleMembershipOrReject(currentUser, room);

        List<TeamMember> members = teamMemberRepository.findByTeamId(team.getId());
        if (members.stream().anyMatch(m -> m.getUser().getId().equals(currentUser.getId()))) {
            throw new ApiException("ALREADY_IN_TEAM: Already in this team", HttpStatus.BAD_REQUEST);
        }

        if (members.size() >= team.getMaxSize()) {
            throw new ApiException("TEAM_FULL: Team is full", HttpStatus.BAD_REQUEST);
        }

        TeamMember member = TeamMember.builder()
                .team(team)
                .user(currentUser)
                .isReady(false)
                .build();

        teamMemberRepository.save(member);

        currentUser.setCurrentTeamId(team.getId());
        userRepository.save(currentUser);

        // Recalculate team ready status
        team.setReady(false); // new member is not ready yet
        team = teamRepository.save(team);

        log.info("User {} joined team {}", currentUser.getUsername(), team.getCode());
<<<<<<< HEAD
=======
        webSocketService.push("/topic/room/" + room.getId() + "/events", java.util.Map.of("type", "LOBBY_UPDATE"));
>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7
        return convertToTeamResponse(team);
    }

    @Transactional
    public TeamResponse toggleReady(UUID teamId, User user) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ApiException("TEAM_NOT_FOUND: Team not found", HttpStatus.NOT_FOUND));

        TeamMember member = teamMemberRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ApiException("FORBIDDEN: Not in this team", HttpStatus.FORBIDDEN));

        if (!member.getTeam().getId().equals(teamId)) {
            throw new ApiException("FORBIDDEN: Not in this team", HttpStatus.FORBIDDEN);
        }

        member.setReady(!member.isReady());
        teamMemberRepository.save(member);

        List<TeamMember> remainingMembers = teamMemberRepository.findByTeamId(teamId);
        boolean allReady = !remainingMembers.isEmpty() && remainingMembers.stream().allMatch(TeamMember::isReady);
        team.setReady(allReady);
        team = teamRepository.save(team);

        log.info("User {} toggled ready status to {} in team {}", user.getUsername(), member.isReady(), team.getCode());
<<<<<<< HEAD
=======
        webSocketService.push("/topic/room/" + team.getRoom().getId() + "/events", java.util.Map.of("type", "LOBBY_UPDATE"));
>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7
        return convertToTeamResponse(team);
    }

    @Transactional
    public TeamResponse kickMember(UUID teamId, UUID userIdToKick, User leader) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ApiException("TEAM_NOT_FOUND: Team not found", HttpStatus.NOT_FOUND));

        if (!team.getLeader().getId().equals(leader.getId())) {
            throw new ApiException("FORBIDDEN: Only the team leader can kick members", HttpStatus.FORBIDDEN);
        }

        if (userIdToKick.equals(leader.getId())) {
            throw new ApiException("BAD_REQUEST: You cannot kick yourself", HttpStatus.BAD_REQUEST);
        }

        TeamMember memberToKick = teamMemberRepository.findByUserId(userIdToKick)
                .orElseThrow(() -> new ApiException("MEMBER_NOT_FOUND: Member not in this team", HttpStatus.NOT_FOUND));

        if (!memberToKick.getTeam().getId().equals(teamId)) {
            throw new ApiException("MEMBER_NOT_FOUND: Member not in this team", HttpStatus.NOT_FOUND);
        }

        teamMemberRepository.delete(memberToKick);

        User kickedUser = userRepository.findById(userIdToKick).orElse(null);
        if (kickedUser != null) {
            kickedUser.setCurrentTeamId(null);
            userRepository.save(kickedUser);
        }

        List<TeamMember> remainingMembers = teamMemberRepository.findByTeamId(teamId);
        boolean allReady = !remainingMembers.isEmpty() && remainingMembers.stream().allMatch(TeamMember::isReady);
        team.setReady(allReady);
        team = teamRepository.save(team);

        log.info("User {} kicked {} from team {}", leader.getUsername(), kickedUser != null ? kickedUser.getUsername() : userIdToKick, team.getCode());
<<<<<<< HEAD
=======
        webSocketService.push("/topic/room/" + team.getRoom().getId() + "/events", java.util.Map.of("type", "LOBBY_UPDATE"));
>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7
        return convertToTeamResponse(team);
    }

    @Transactional
    public void leaveTeam(UUID teamId, User user) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ApiException("TEAM_NOT_FOUND: Team not found", HttpStatus.NOT_FOUND));

        TeamMember member = teamMemberRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ApiException("FORBIDDEN: Not in this team", HttpStatus.FORBIDDEN));

        if (!member.getTeam().getId().equals(teamId)) {
            throw new ApiException("FORBIDDEN: Not in this team", HttpStatus.FORBIDDEN);
        }

        if (team.getLeader().getId().equals(user.getId())) {
            // Disband the entire team
            log.info("Leader left team {}. Disbanding team.", team.getCode());
            List<TeamMember> members = teamMemberRepository.findByTeamId(teamId);
            for (TeamMember m : members) {
                User u = m.getUser();
                u.setCurrentTeamId(null);
                userRepository.save(u);
            }
            teamMemberRepository.deleteAll(members);
            teamRepository.delete(team);
        } else {
            // Leave team
            teamMemberRepository.delete(member);
            User currentUser = userRepository.findById(user.getId()).orElse(null);
            if (currentUser != null) {
                currentUser.setCurrentTeamId(null);
                userRepository.save(currentUser);
            }

            List<TeamMember> remainingMembers = teamMemberRepository.findByTeamId(teamId);
            boolean allReady = !remainingMembers.isEmpty() && remainingMembers.stream().allMatch(TeamMember::isReady);
            team.setReady(allReady);
            teamRepository.save(team);
            log.info("User {} left team {}", user.getUsername(), team.getCode());
        }
<<<<<<< HEAD
=======
        webSocketService.push("/topic/room/" + team.getRoom().getId() + "/events", java.util.Map.of("type", "LOBBY_UPDATE"));
>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7
    }

    public List<TeamResponse> getTeamsInRoom(UUID roomId) {
        return teamRepository.findByRoomId(roomId)
                .stream()
                .map(this::convertToTeamResponse)
                .collect(Collectors.toList());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public TeamResponse convertToTeamResponse(Team t) {
        List<TeamMember> teamMembers = teamMemberRepository.findByTeamId(t.getId());
        List<TeamMemberResponse> memberResponses = teamMembers.stream()
                .map(tm -> TeamMemberResponse.builder()
                        .userId(tm.getUser().getId())
                        .username(tm.getUser().getUsername())
                        .isReady(tm.isReady())
                        .build())
                .collect(Collectors.toList());

        return TeamResponse.builder()
                .id(t.getId())
                .code(t.getCode())
                .name(t.getName())
                .roomId(t.getRoom().getId())
                .leaderId(t.getLeader().getId())
                .leaderUsername(t.getLeader().getUsername())
                .score(t.getScore())
                .maxSize(t.getMaxSize())
                .isReady(t.isReady())
                .members(memberResponses)
                .build();
    }

    private void removeStaleMembershipOrReject(User user, Room targetRoom) {
        TeamMember existingMember = teamMemberRepository.findByUserId(user.getId()).orElse(null);
        if (existingMember == null) {
            if (user.getCurrentTeamId() != null) {
                user.setCurrentTeamId(null);
                userRepository.save(user);
            }
            return;
        }

        Team existingTeam = existingMember.getTeam();
        if (existingTeam.getRoom().getId().equals(targetRoom.getId())) {
            throw new ApiException("ALREADY_IN_TEAM: Already in a team in this room", HttpStatus.BAD_REQUEST);
        }

        if (existingTeam.getLeader().getId().equals(user.getId())) {
            List<TeamMember> existingTeamMembers = teamMemberRepository.findByTeamId(existingTeam.getId());
            for (TeamMember member : existingTeamMembers) {
                User memberUser = member.getUser();
                memberUser.setCurrentTeamId(null);
                userRepository.save(memberUser);
            }
            teamMemberRepository.deleteAll(existingTeamMembers);
            teamRepository.delete(existingTeam);
        } else {
            teamMemberRepository.delete(existingMember);
            List<TeamMember> remainingMembers = teamMemberRepository.findByTeamId(existingTeam.getId());
            boolean allReady = !remainingMembers.isEmpty() && remainingMembers.stream().allMatch(TeamMember::isReady);
            existingTeam.setReady(allReady);
            teamRepository.save(existingTeam);
            user.setCurrentTeamId(null);
            userRepository.save(user);
        }
    }

    private String generateUniqueCode() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        Random random = new Random();
        while (true) {
            StringBuilder sb = new StringBuilder(6);
            for (int i = 0; i < 6; i++) {
                sb.append(chars.charAt(random.nextInt(chars.length())));
            }
            String code = sb.toString();
            if (teamRepository.findByCode(code).isEmpty()) {
                return code;
            }
        }
    }
}
