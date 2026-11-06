package com.codearena.room.service;

import com.codearena.room.domain.*;
import com.codearena.room.exception.*;
import com.codearena.room.repository.KickedUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class RoomValidationRuleEngine {

    private final KickedUserRepository kickedUserRepository;

    public void validateCanJoinRoom(Room room, UUID userId, long activeMemberCount) {
        if (room.getStatus() != RoomStatus.WAITING) {
            throw new IllegalRoomStateException("Room is not accepting new players. Current status: " + room.getStatus());
        }

        if (kickedUserRepository.existsByRoomIdAndUserId(room.getId(), userId)) {
            throw new UserKickedException("You have been kicked from room " + room.getRoomCode() + " and cannot rejoin");
        }

        if (activeMemberCount >= room.getMaxPlayers()) {
            throw new RoomFullException("Room " + room.getRoomCode() + " has reached maximum capacity of " + room.getMaxPlayers() + " players");
        }
    }

    public void validateCanStartRoom(Room room, UUID userId, List<Team> teams, List<RoomMember> activeMembers) {
        if (!room.getAdminId().equals(userId)) {
            throw new UnauthorizedRoomActionException("Only the room admin can start the contest");
        }

        if (room.getStatus() != RoomStatus.WAITING) {
            throw new IllegalRoomStateException("Contest cannot be started when room status is: " + room.getStatus());
        }

        List<String> errors = new ArrayList<>();

        if (room.getMode() == RoomMode.SOLO) {
            if (activeMembers.size() < 2) {
                errors.add("SOLO mode contest requires at least 2 active players to start. Current players: " + activeMembers.size());
            }
        } else if (room.getMode() == RoomMode.TEAM) {
            if (teams.size() < 2) {
                errors.add("TEAM mode contest requires at least 2 teams to start. Current teams: " + teams.size());
            }

            for (Team team : teams) {
                if (team.getMemberCount() != Room.FIXED_TEAM_SIZE) {
                    errors.add("Team '" + team.getName() + "' currently has " + team.getMemberCount()
                            + "/4 members. Every team must have exactly 4 members to start.");
                }
            }
        }

        if (!errors.isEmpty()) {
            throw new RoomStartValidationException(errors);
        }
    }

    public void validateCanCreateTeam(Room room, RoomMember member, long currentTeamCount) {
        if (room.getMode() != RoomMode.TEAM) {
            throw new RoomRuleViolationException("Teams can only be created in TEAM mode rooms");
        }

        if (room.getStatus() != RoomStatus.WAITING) {
            throw new IllegalRoomStateException("Cannot create a team after contest has started or closed");
        }

        if (member.getStatus() != MemberStatus.ACTIVE) {
            throw new NotRoomMemberException("You are not an active member in this room");
        }

        if (member.getTeamId() != null) {
            throw new RoomRuleViolationException("You are already a member of a team in this room. Leave your current team first");
        }

        if (room.getMaxTeams() != null && currentTeamCount >= room.getMaxTeams()) {
            throw new RoomRuleViolationException("Maximum number of teams (" + room.getMaxTeams() + ") has been reached for this room");
        }
    }

    public void validateCanJoinTeam(Room room, Team team, RoomMember member) {
        if (room.getMode() != RoomMode.TEAM) {
            throw new RoomRuleViolationException("Teams are only supported in TEAM mode rooms");
        }

        if (room.getStatus() != RoomStatus.WAITING) {
            throw new IllegalRoomStateException("Cannot join a team after contest has started or closed");
        }

        if (member.getStatus() != MemberStatus.ACTIVE) {
            throw new NotRoomMemberException("You are not an active member in this room");
        }

        if (team.getMemberCount() >= Room.FIXED_TEAM_SIZE) {
            throw new TeamFullException("Team '" + team.getName() + "' is already full (maximum 4 members)");
        }

        if (member.getTeamId() != null) {
            if (member.getTeamId().equals(team.getId())) {
                throw new RoomRuleViolationException("You are already a member of team '" + team.getName() + "'");
            }
            if (member.getRole() == MemberRole.LEADER) {
                throw new RoomRuleViolationException("Team leaders cannot switch teams. Dissolve your current team first");
            }
        }
    }

    public void validateCanLeaveTeam(Room room, RoomMember member, Team team) {
        if (room.getStatus() != RoomStatus.WAITING) {
            throw new IllegalRoomStateException("Cannot leave team after contest has started or closed");
        }

        if (member.getTeamId() == null || !member.getTeamId().equals(team.getId())) {
            throw new RoomRuleViolationException("You are not a member of team '" + team.getName() + "'");
        }
    }

    public void validateCanDissolveTeam(Room room, Team team, UUID userId) {
        if (room.getStatus() != RoomStatus.WAITING) {
            throw new IllegalRoomStateException("Cannot dissolve team after contest has started or closed");
        }

        boolean isLeader = team.getLeaderId().equals(userId);
        boolean isAdmin = room.getAdminId().equals(userId);

        if (!isLeader && !isAdmin) {
            throw new UnauthorizedRoomActionException("Only the team leader or room admin can dissolve this team");
        }
    }

    public void validateCanKick(Room room, UUID kickerId, UUID targetUserId) {
        if (room.getStatus() != RoomStatus.WAITING) {
            throw new IllegalRoomStateException("Cannot kick players after contest has started or closed");
        }

        if (kickerId.equals(targetUserId)) {
            throw new RoomRuleViolationException("You cannot kick yourself from the room");
        }

        if (room.getAdminId() == null || !room.getAdminId().equals(kickerId)) {
            throw new UnauthorizedRoomActionException("Only the room admin can kick players from the room");
        }
    }

    public void validateCanKickFromTeam(Room room, Team team, UUID kickerId, UUID targetUserId) {
        if (room.getStatus() != RoomStatus.WAITING) {
            throw new IllegalRoomStateException("Cannot kick players after contest has started or closed");
        }

        if (!team.getLeaderId().equals(kickerId)) {
            throw new UnauthorizedRoomActionException("Only the team leader can kick members from this team");
        }

        if (kickerId.equals(targetUserId)) {
            throw new RoomRuleViolationException("A team leader cannot kick themselves. Dissolve or leave the team instead");
        }

        if (room.getAdminId().equals(targetUserId)) {
            throw new UnauthorizedRoomActionException("Team leaders cannot kick the room admin");
        }
    }
}
