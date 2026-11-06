package com.codearena.room.service;

import com.codearena.auth.entity.User;
import com.codearena.auth.repository.UserRepository;
import com.codearena.room.domain.*;
import com.codearena.room.dto.CreateTeamRequest;
import com.codearena.room.dto.JoinTeamRequest;
import com.codearena.room.dto.MemberDto;
import com.codearena.room.dto.TeamDto;
import com.codearena.room.event.RoomEvent;
import com.codearena.room.event.RoomEventType;
import com.codearena.room.exception.*;
import com.codearena.room.repository.RoomMemberRepository;
import com.codearena.room.repository.RoomRepository;
import com.codearena.room.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TeamService {

    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final TeamRepository teamRepository;
    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final UserRepository userRepository;
    private final RoomValidationRuleEngine ruleEngine;
    private final RoomMetricsService roomMetricsService;
    private final ApplicationEventPublisher eventPublisher;
    private final RoomService roomService;
    private final CodeAttemptRateLimiter codeAttemptRateLimiter;

    @Transactional
    public TeamDto createTeam(UUID roomId, CreateTeamRequest request, UUID userId) {
        return createTeam(roomId.toString(), request, userId);
    }

    @Transactional
    public TeamDto joinTeam(UUID roomId, JoinTeamRequest request, UUID userId) {
        return joinTeam(roomId.toString(), request, userId);
    }

    @Transactional
    public void leaveTeam(UUID roomId, UUID teamId, UUID userId) {
        leaveTeam(roomId.toString(), teamId, userId);
    }

    @Transactional
    public void deleteTeam(UUID roomId, UUID teamId, UUID userId) {
        deleteTeam(roomId.toString(), teamId, userId);
    }

    @Transactional
    public void kickTeamMember(UUID roomId, UUID teamId, UUID targetUserId, UUID kickerId) {
        kickTeamMember(roomId.toString(), teamId, targetUserId, kickerId);
    }

    @Transactional
    public TeamDto createTeam(String roomIdentifier, CreateTeamRequest request, UUID userId) {
        Room room = roomService.resolveRoom(roomIdentifier);
        UUID roomId = room.getId();

        RoomMember member = roomMemberRepository.findByRoomIdAndUserIdAndStatus(roomId, userId, MemberStatus.ACTIVE)
                .orElseThrow(() -> new NotRoomMemberException("You are not an active member in this room"));

        long currentTeamCount = teamRepository.countByRoomId(roomId);
        ruleEngine.validateCanCreateTeam(room, member, currentTeamCount);

        String teamCode = generateUniqueTeamCode(roomId);
        Team team = Team.builder()
                .roomId(roomId)
                .code(teamCode)
                .name(request.getName().trim())
                .leaderId(userId)
                .memberCount(1)
                .createdAt(Instant.now())
                .build();

        Team savedTeam = teamRepository.save(team);

        member.setTeamId(savedTeam.getId());
        member.setRole(MemberRole.LEADER);
        roomMemberRepository.save(member);

        long newVersion = incrementRoomVersion(room);
        String username = resolveUsername(userId);

        eventPublisher.publishEvent(RoomEvent.builder()
                .type(RoomEventType.TEAM_CREATED)
                .roomId(roomId)
                .version(newVersion)
                .data(Map.of(
                        "teamId", savedTeam.getId(),
                        "teamName", savedTeam.getName(),
                        "leaderId", userId,
                        "leaderUsername", username,
                        "memberCount", 1
                ))
                .build());

        log.info("Team created: '{}' (code: {}) in room {} by leader {}",
                savedTeam.getName(), savedTeam.getCode(), room.getRoomCode(), username);

        return toTeamDto(savedTeam, List.of(toMemberDto(member, username)));
    }

    /**
     * Joins a team with atomic SQL capacity enforcement:
     * UPDATE team SET member_count = member_count + 1 WHERE id = ? AND member_count < 4
     * If 0 rows updated, throws TeamFullException.
     * Switching teams decrements the old team and increments the new one in one transaction.
     */
    @Transactional
    public TeamDto joinTeam(String roomIdentifier, JoinTeamRequest request, UUID userId) {
        codeAttemptRateLimiter.checkRateLimit(userId);

        Room room = roomService.resolveRoom(roomIdentifier);
        UUID roomId = room.getId();

        RoomMember member = roomMemberRepository.findByRoomIdAndUserIdAndStatus(roomId, userId, MemberStatus.ACTIVE)
                .orElseThrow(() -> new NotRoomMemberException("You are not an active member in this room"));

        String cleanCode = request.getTeamCode().trim().toUpperCase(Locale.ROOT);

        Team targetTeam = teamRepository.findByRoomIdAndCode(roomId, cleanCode)
                .orElseThrow(() -> {
                    codeAttemptRateLimiter.recordFailedAttempt(userId);
                    return new InvalidTeamCodeException("Invalid team code for this room");
                });

        ruleEngine.validateCanJoinTeam(room, targetTeam, member);

        UUID oldTeamId = member.getTeamId();
        if (oldTeamId != null) {
            // Member is switching from another team: decrement old team member count
            teamRepository.decrementMemberCount(oldTeamId);
            log.info("User {} switched out of old team {}", userId, oldTeamId);
        }

        // Atomic SQL increment: enforces capacity < 4 at the database row level
        int updatedRows = teamRepository.incrementMemberCountIfUnderCapacity(targetTeam.getId());
        if (updatedRows == 0) {
            throw new TeamFullException("Team '" + targetTeam.getName() + "' is already full (maximum 4 members)");
        }

        member.setTeamId(targetTeam.getId());
        member.setRole(MemberRole.MEMBER);
        roomMemberRepository.save(member);

        codeAttemptRateLimiter.reset(userId);

        roomMetricsService.recordTeamJoin();
        long newVersion = incrementRoomVersion(room);
        String username = resolveUsername(userId);

        // Fetch fresh team state
        Team refreshedTeam = teamRepository.findById(targetTeam.getId()).orElse(targetTeam);

        eventPublisher.publishEvent(RoomEvent.builder()
                .type(RoomEventType.TEAM_JOINED)
                .roomId(roomId)
                .version(newVersion)
                .data(Map.of(
                        "teamId", refreshedTeam.getId(),
                        "teamName", refreshedTeam.getName(),
                        "userId", userId,
                        "username", username,
                        "memberCount", refreshedTeam.getMemberCount()
                ))
                .build());

        log.info("User {} joined team '{}' ({}/{} members)",
                username, refreshedTeam.getName(), refreshedTeam.getMemberCount(), Room.FIXED_TEAM_SIZE);

        List<RoomMember> teamMembers = roomMemberRepository.findByTeamIdAndStatus(refreshedTeam.getId(), MemberStatus.ACTIVE);
        return toTeamDtoWithMembers(refreshedTeam, teamMembers);
    }

    @Transactional
    public void leaveTeam(String roomIdentifier, UUID teamId, UUID userId) {
        Room room = roomService.resolveRoom(roomIdentifier);
        UUID roomId = room.getId();

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new TeamNotFoundException("Team not found with ID: " + teamId));

        RoomMember member = roomMemberRepository.findByRoomIdAndUserIdAndStatus(roomId, userId, MemberStatus.ACTIVE)
                .orElseThrow(() -> new NotRoomMemberException("You are not an active member in this room"));

        ruleEngine.validateCanLeaveTeam(room, member, team);

        if (team.getLeaderId().equals(userId)) {
            // Leader leaving dissolves the entire team; members go back to unassigned
            dissolveTeam(room, team);
        } else {
            // Regular member leaving
            member.setTeamId(null);
            member.setRole(MemberRole.MEMBER);
            roomMemberRepository.save(member);

            teamRepository.decrementMemberCount(team.getId());

            long newVersion = incrementRoomVersion(room);
            String username = resolveUsername(userId);

            Team refreshedTeam = teamRepository.findById(team.getId()).orElse(team);

            eventPublisher.publishEvent(RoomEvent.builder()
                    .type(RoomEventType.TEAM_JOINED)
                    .roomId(roomId)
                    .version(newVersion)
                    .data(Map.of(
                            "action", "MEMBER_LEFT_TEAM",
                            "teamId", refreshedTeam.getId(),
                            "userId", userId,
                            "username", username,
                            "memberCount", refreshedTeam.getMemberCount()
                    ))
                    .build());

            log.info("Member {} left team '{}'", username, team.getName());
        }
    }

    @Transactional
    public void deleteTeam(String roomIdentifier, UUID teamId, UUID userId) {
        Room room = roomService.resolveRoom(roomIdentifier);
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new TeamNotFoundException("Team not found with ID: " + teamId));

        ruleEngine.validateCanDissolveTeam(room, team, userId);
        dissolveTeam(room, team);
    }

    @Transactional
    public void kickTeamMember(String roomIdentifier, UUID teamId, UUID targetUserId, UUID kickerId) {
        Room room = roomService.resolveRoom(roomIdentifier);
        UUID roomId = room.getId();

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new TeamNotFoundException("Team not found with ID: " + teamId));

        ruleEngine.validateCanKickFromTeam(room, team, kickerId, targetUserId);

        RoomMember target = roomMemberRepository.findByRoomIdAndUserIdAndStatus(roomId, targetUserId, MemberStatus.ACTIVE)
                .orElseThrow(() -> new NotRoomMemberException("Target user is not an active member in this room"));

        if (target.getTeamId() == null || !target.getTeamId().equals(team.getId())) {
            throw new RoomRuleViolationException("Target user is not a member of team '" + team.getName() + "'");
        }

        target.setTeamId(null);
        target.setRole(MemberRole.MEMBER);
        roomMemberRepository.save(target);

        teamRepository.decrementMemberCount(team.getId());
        long newVersion = incrementRoomVersion(room);
        String username = resolveUsername(targetUserId);

        Team refreshedTeam = teamRepository.findById(team.getId()).orElse(team);

        eventPublisher.publishEvent(RoomEvent.builder()
                .type(RoomEventType.TEAM_JOINED)
                .roomId(roomId)
                .version(newVersion)
                .data(Map.of(
                        "action", "MEMBER_KICKED_FROM_TEAM",
                        "teamId", team.getId(),
                        "userId", targetUserId,
                        "username", username,
                        "memberCount", refreshedTeam.getMemberCount()
                ))
                .build());

        log.info("Team leader {} kicked member {} from team {}", kickerId, username, team.getName());
    }

    private void dissolveTeam(Room room, Team team) {
        List<RoomMember> members = roomMemberRepository.findByTeamId(team.getId());
        for (RoomMember m : members) {
            m.setTeamId(null);
            m.setRole(MemberRole.MEMBER);
        }
        roomMemberRepository.saveAll(members);
        teamRepository.delete(team);

        long newVersion = incrementRoomVersion(room);

        eventPublisher.publishEvent(RoomEvent.builder()
                .type(RoomEventType.TEAM_DISSOLVED)
                .roomId(room.getId())
                .version(newVersion)
                .data(Map.of(
                        "teamId", team.getId(),
                        "teamName", team.getName()
                ))
                .build());

        log.info("Team '{}' ({}) in room {} was dissolved", team.getName(), team.getCode(), room.getRoomCode());
    }

    private long incrementRoomVersion(Room room) {
        return roomRepository.incrementAndGetVersion(room.getId());
    }

    private String generateUniqueTeamCode(UUID roomId) {
        for (int i = 0; i < 20; i++) {
            StringBuilder sb = new StringBuilder(6);
            for (int j = 0; j < 6; j++) {
                sb.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
            }
            String code = sb.toString();
            if (!teamRepository.existsByRoomIdAndCode(roomId, code)) {
                return code;
            }
        }
        return UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }

    private String resolveUsername(UUID userId) {
        return userRepository.findById(userId)
                .map(User::getUsername)
                .orElse("Unknown");
    }

    private MemberDto toMemberDto(RoomMember member, String username) {
        return MemberDto.builder()
                .id(member.getId())
                .userId(member.getUserId())
                .username(username)
                .roomId(member.getRoomId())
                .teamId(member.getTeamId())
                .role(member.getRole())
                .status(member.getStatus())
                .joinedAt(member.getJoinedAt())
                .build();
    }

    private TeamDto toTeamDto(Team team, List<MemberDto> members) {
        return TeamDto.builder()
                .id(team.getId())
                .roomId(team.getRoomId())
                .code(team.getCode())
                .teamCode(team.getCode())
                .name(team.getName())
                .teamName(team.getName())
                .leaderId(team.getLeaderId())
                .leaderUserId(team.getLeaderId())
                .memberCount(team.getMemberCount())
                .members(members)
                .createdAt(team.getCreatedAt())
                .build();
    }

    private TeamDto toTeamDtoWithMembers(Team team, List<RoomMember> members) {
        Set<UUID> userIds = members.stream().map(RoomMember::getUserId).collect(Collectors.toSet());
        Map<UUID, String> userMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, User::getUsername));

        List<MemberDto> memberDtos = members.stream()
                .map(m -> toMemberDto(m, userMap.getOrDefault(m.getUserId(), "Unknown")))
                .toList();

        return toTeamDto(team, memberDtos);
    }
}
