package com.codearena.room.service;

import com.codearena.auth.entity.User;
import com.codearena.auth.repository.UserRepository;
import com.codearena.room.domain.*;
import com.codearena.room.dto.*;
import com.codearena.room.event.RoomEvent;
import com.codearena.room.event.RoomEventType;
import com.codearena.room.exception.*;
import com.codearena.room.repository.KickedUserRepository;
import com.codearena.room.repository.RoomMemberRepository;
import com.codearena.room.repository.RoomRepository;
import com.codearena.room.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoomService {

    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final RoomRepository roomRepository;
    private final TeamRepository teamRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final KickedUserRepository kickedUserRepository;
    private final UserRepository userRepository;
    private final RoomValidationRuleEngine ruleEngine;
    private final RoomMetricsService roomMetricsService;
    private final ApplicationEventPublisher eventPublisher;
    private final CodeAttemptRateLimiter codeAttemptRateLimiter;

    public Room resolveRoom(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            throw new RoomNotFoundException("Room identifier cannot be blank");
        }
        String clean = identifier.trim();
        Optional<Room> byCode = roomRepository.findByRoomCode(clean.toUpperCase(Locale.ROOT));
        if (byCode.isPresent()) {
            return byCode.get();
        }
        try {
            UUID uuid = UUID.fromString(clean);
            return roomRepository.findById(uuid)
                    .orElseThrow(() -> new RoomNotFoundException("Room not found with ID: " + clean));
        } catch (IllegalArgumentException e) {
            throw new RoomNotFoundException("Room not found with code: " + clean);
        }
    }

    @Transactional
    public RoomSnapshotDto createRoom(CreateRoomRequest request, UUID adminId) {
        ActiveRoomDto existingActive = getActiveRoomForUser(adminId);
        if (existingActive.isHasActiveRoom()) {
            throw new RoomRuleViolationException("You already have an active room (" + existingActive.getRoomCode() + "). Leave it before creating a new room.");
        }

        String roomCode = generateUniqueRoomCode();
        String roomName = request.getRoomName() != null ? request.getRoomName().trim() : "Arena Contest";

        int durationMinutes = request.getDurationMinutes() != null ? request.getDurationMinutes() : 30;
        Integer maxTeams = null;
        int maxPlayers;

        if (request.getMode() == RoomMode.TEAM) {
            maxTeams = request.getMaxTeams() != null ? request.getMaxTeams() : 4;
            maxPlayers = maxTeams * Room.FIXED_TEAM_SIZE;
        } else {
            maxPlayers = request.getMaxPlayers() != null ? request.getMaxPlayers() : 10;
        }

        Room room = Room.builder()
                .roomCode(roomCode)
                .roomName(roomName)
                .adminId(adminId)
                .mode(request.getMode())
                .status(RoomStatus.WAITING)
                .maxTeams(maxTeams)
                .maxPlayers(maxPlayers)
                .durationMinutes(durationMinutes)
                .version(1L)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        Room savedRoom = roomRepository.save(room);

        RoomMember adminMember = RoomMember.builder()
                .roomId(savedRoom.getId())
                .userId(adminId)
                .teamId(null)
                .role(MemberRole.ADMIN)
                .status(MemberStatus.ACTIVE)
                .joinedAt(Instant.now())
                .build();

        roomMemberRepository.save(adminMember);
        roomMetricsService.recordRoomCreated();

        log.info("Room created with id={}, code={}, name='{}', mode={}, adminId={}",
                savedRoom.getId(), roomCode, roomName, request.getMode(), adminId);

        return getRoomSnapshot(savedRoom.getId(), adminId);
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<AvailableRoomDto> getAvailableRooms(org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.domain.Page<Room> rooms = roomRepository.findByStatusOrderByCreatedAtDesc(RoomStatus.WAITING, pageable);

        Set<UUID> adminIds = rooms.getContent().stream().map(Room::getAdminId).collect(Collectors.toSet());
        Map<UUID, String> adminUsernames = userRepository.findAllById(adminIds).stream()
                .collect(Collectors.toMap(User::getId, User::getUsername));

        return rooms.map(r -> {
            long activeCount = roomMemberRepository.countByRoomIdAndStatus(r.getId(), MemberStatus.ACTIVE);
            int maxP = (r.getMode() == RoomMode.TEAM) ? (r.getMaxTeams() * 4) : r.getMaxPlayers();
            return AvailableRoomDto.builder()
                    .id(r.getId())
                    .roomName(r.getRoomName())
                    .mode(r.getMode())
                    .adminUsername(adminUsernames.getOrDefault(r.getAdminId(), "Admin"))
                    .currentPlayers((int) activeCount)
                    .maxPlayers(maxP)
                    .status(r.getStatus())
                    .createdAt(r.getCreatedAt())
                    .build();
        });
    }

    @Transactional
    public RoomSnapshotDto joinRoom(JoinRoomRequest request, UUID userId) {
        codeAttemptRateLimiter.checkRateLimit(userId);
        try {
            String cleanCode = request.getRoomCode().trim().toUpperCase(Locale.ROOT);
            Room room = roomRepository.findByRoomCode(cleanCode)
                    .orElseThrow(() -> new RoomNotFoundException("Room with code '" + cleanCode + "' does not exist"));

            if (room.getStatus() == RoomStatus.DELETED || room.getStatus() == RoomStatus.CLOSED) {
                throw new RoomRuleViolationException("This room has been deleted by the host.");
            }
            if (room.getStatus() == RoomStatus.ENDED) {
                throw new RoomRuleViolationException("This contest has ended.");
            }

            ActiveRoomDto existingActive = getActiveRoomForUser(userId);
            if (existingActive.isHasActiveRoom() && !existingActive.getRoomId().equals(room.getId())) {
                throw new RoomRuleViolationException("You already have an active room (" + existingActive.getRoomCode() + "). Leave it before joining another room.");
            }

            Optional<RoomMember> existingMemberOpt = roomMemberRepository.findByRoomIdAndUserId(room.getId(), userId);
            RoomMember member;

            if (existingMemberOpt.isPresent()) {
                member = existingMemberOpt.get();
                if (member.getStatus() == MemberStatus.ACTIVE) {
                    codeAttemptRateLimiter.reset(userId);
                    return getRoomSnapshot(room.getId(), userId);
                }
                // Rejoining active room after leaving
                if (room.getStatus() != RoomStatus.WAITING) {
                    throw new RoomRuleViolationException("Cannot rejoin contest once it has already started.");
                }
                long activeMembers = roomMemberRepository.countByRoomIdAndStatus(room.getId(), MemberStatus.ACTIVE);
                ruleEngine.validateCanJoinRoom(room, userId, activeMembers);

                member.setStatus(MemberStatus.ACTIVE);
                member.setTeamId(null);
                member.setRole(MemberRole.MEMBER);
                member.setJoinedAt(Instant.now());
            } else {
                long activeMembers = roomMemberRepository.countByRoomIdAndStatus(room.getId(), MemberStatus.ACTIVE);
                ruleEngine.validateCanJoinRoom(room, userId, activeMembers);

                member = RoomMember.builder()
                        .roomId(room.getId())
                        .userId(userId)
                        .teamId(null)
                        .role(MemberRole.MEMBER)
                        .status(MemberStatus.ACTIVE)
                        .joinedAt(Instant.now())
                        .build();
            }

            RoomMember savedMember = roomMemberRepository.save(member);
            long newVersion = incrementRoomVersion(room);

            String username = resolveUsername(userId);
            MemberDto memberDto = toMemberDto(savedMember, username);

            // Broadcast PLAYER_JOINED after commit
            eventPublisher.publishEvent(RoomEvent.builder()
                    .type(RoomEventType.PLAYER_JOINED)
                    .roomId(room.getId())
                    .version(newVersion)
                    .data(memberDto)
                    .build());

            log.info("User {} ({}) joined room {}", username, userId, room.getRoomCode());
            codeAttemptRateLimiter.reset(userId);
            return getRoomSnapshot(room.getId(), userId);
        } catch (Exception ex) {
            codeAttemptRateLimiter.recordFailedAttempt(userId);
            throw ex;
        }
    }

    @Transactional
    public void leaveRoom(UUID roomId, UUID userId) {
        leaveRoom(roomId.toString(), userId);
    }

    @Transactional
    public RoomSnapshotDto startRoom(UUID roomId, UUID userId) {
        return startRoom(roomId.toString(), userId);
    }

    @Transactional
    public void closeRoom(UUID roomId, UUID userId) {
        closeRoom(roomId.toString(), userId);
    }

    @Transactional
    public void kickUser(UUID roomId, UUID targetUserId, UUID kickerId, String reason) {
        kickUser(roomId.toString(), targetUserId, kickerId, reason);
    }

    @Transactional
    public void leaveRoom(String identifier, UUID userId) {
        Room room = resolveRoom(identifier);
        UUID roomId = room.getId();

        RoomMember member = roomMemberRepository.findByRoomIdAndUserIdAndStatus(roomId, userId, MemberStatus.ACTIVE)
                .orElseThrow(() -> new NotRoomMemberException("You are not an active member in this room"));

        // If the Admin leaves, mark room as DELETED and dismiss all members
        if (room.getAdminId().equals(userId)) {
            deleteRoomByAdmin(room, userId);
            return;
        }

        if (room.getStatus() != RoomStatus.WAITING) {
            throw new IllegalRoomStateException("Cannot leave room after contest has started or closed");
        }

        // If in TEAM mode and member is in a team
        if (member.getTeamId() != null) {
            Optional<Team> teamOpt = teamRepository.findById(member.getTeamId());
            if (teamOpt.isPresent()) {
                Team team = teamOpt.get();
                if (team.getLeaderId().equals(userId)) {
                    // Team leader leaving dissolves the team, members go back to unassigned
                    dissolveTeamInternal(room, team);
                } else {
                    // Regular team member leaving
                    teamRepository.decrementMemberCount(team.getId());
                }
            }
        }

        member.setStatus(MemberStatus.LEFT);
        member.setTeamId(null);
        roomMemberRepository.save(member);

        long newVersion = incrementRoomVersion(room);
        String username = resolveUsername(userId);

        eventPublisher.publishEvent(RoomEvent.builder()
                .type(RoomEventType.PLAYER_LEFT)
                .roomId(room.getId())
                .version(newVersion)
                .data(Map.of("userId", userId, "username", username))
                .build());

        log.info("User {} left room {}", username, room.getRoomCode());
    }

    @Transactional
    public RoomSnapshotDto startRoom(String identifier, UUID userId) {
        Room resolved = resolveRoom(identifier);
        Room room = roomRepository.findByIdForUpdate(resolved.getId())
                .orElseThrow(() -> new RoomNotFoundException("Room not found with ID: " + resolved.getId()));

        List<Team> teams = teamRepository.findByRoomId(room.getId());
        List<RoomMember> activeMembers = roomMemberRepository.findByRoomIdAndStatus(room.getId(), MemberStatus.ACTIVE);

        ruleEngine.validateCanStartRoom(room, userId, teams, activeMembers);

        Instant now = Instant.now();
        room.setStatus(RoomStatus.IN_PROGRESS);
        room.setStartedAt(now);
        room.setEndsAt(now.plus(Duration.ofMinutes(room.getDurationMinutes())));
        room.setUpdatedAt(now);
        roomRepository.save(room);
        long newVersion = incrementRoomVersion(room);

        // In TEAM mode: any unassigned active players are marked DISQUALIFIED (rows kept)
        if (room.getMode() == RoomMode.TEAM) {
            for (RoomMember member : activeMembers) {
                if (member.getTeamId() == null) {
                    member.setStatus(MemberStatus.DISQUALIFIED);
                    roomMemberRepository.save(member);

                    // Send private disqualified alert
                    eventPublisher.publishEvent(RoomEvent.builder()
                            .type(RoomEventType.PLAYER_DISQUALIFIED)
                            .roomId(room.getId())
                            .roomCode(room.getRoomCode())
                            .version(newVersion)
                            .targetUserId(member.getUserId())
                            .data(Map.of(
                                    "userId", member.getUserId(),
                                    "reason", "Disqualified: Unassigned to a full team at contest start"
                            ))
                            .build());
                }
            }
        }

        eventPublisher.publishEvent(RoomEvent.builder()
                .type(RoomEventType.ROOM_STARTED)
                .roomId(room.getId())
                .roomCode(room.getRoomCode())
                .version(newVersion)
                .data(Map.of("status", RoomStatus.IN_PROGRESS, "startedAt", now, "endsAt", room.getEndsAt()))
                .build());

        log.info("Room {} started by admin {}", room.getRoomCode(), userId);
        return getRoomSnapshot(room.getId(), userId);
    }

    @Transactional
    public void deleteRoomByAdmin(Room room, UUID adminId) {
        room.setStatus(RoomStatus.DELETED);
        room.setUpdatedAt(Instant.now());
        roomRepository.save(room);
        long newVersion = incrementRoomVersion(room);

        // Mark all members as LEFT and clear teams so no active room locks remain
        List<RoomMember> allMembers = roomMemberRepository.findByRoomId(room.getId());
        for (RoomMember m : allMembers) {
            m.setStatus(MemberStatus.LEFT);
            m.setTeamId(null);
            roomMemberRepository.save(m);
        }

        // Dissolve any teams
        List<Team> teams = teamRepository.findByRoomId(room.getId());
        teamRepository.deleteAll(teams);

        eventPublisher.publishEvent(RoomEvent.builder()
                .type(RoomEventType.ROOM_CLOSED)
                .roomId(room.getId())
                .roomCode(room.getRoomCode())
                .version(newVersion)
                .data(Map.of("status", RoomStatus.DELETED, "closedAt", Instant.now(), "reason", "Admin left / room deleted"))
                .build());

        log.info("Room {} marked DELETED because admin {} left or closed it", room.getRoomCode(), adminId);
    }

    @Transactional
    public void closeRoom(String identifier, UUID userId) {
        Room room = resolveRoom(identifier);

        if (!room.getAdminId().equals(userId)) {
            throw new UnauthorizedRoomActionException("Only the room admin can close the room");
        }

        deleteRoomByAdmin(room, userId);
    }

    @Transactional
    public void kickUser(String identifier, UUID targetUserId, UUID kickerId, String reason) {
        Room room = resolveRoom(identifier);
        UUID roomId = room.getId();

        ruleEngine.validateCanKick(room, kickerId, targetUserId);

        RoomMember kicker = roomMemberRepository.findByRoomIdAndUserIdAndStatus(roomId, kickerId, MemberStatus.ACTIVE)
                .orElseThrow(() -> new NotRoomMemberException("Kicker is not an active member in this room"));

        RoomMember target = roomMemberRepository.findByRoomIdAndUserIdAndStatus(roomId, targetUserId, MemberStatus.ACTIVE)
                .orElseThrow(() -> new NotRoomMemberException("Target user is not an active member in this room"));

        String targetUsername = resolveUsername(targetUserId);

        if (kicker.getRole() == MemberRole.ADMIN || room.getAdminId().equals(kickerId)) {
            // ADMIN KICK: Removes player from the room entirely, disallows rejoining
            if (target.getTeamId() != null) {
                Optional<Team> teamOpt = teamRepository.findById(target.getTeamId());
                if (teamOpt.isPresent()) {
                    Team team = teamOpt.get();
                    if (team.getLeaderId().equals(targetUserId)) {
                        dissolveTeamInternal(room, team);
                    } else {
                        teamRepository.decrementMemberCount(team.getId());
                    }
                }
            }

            target.setStatus(MemberStatus.LEFT);
            target.setTeamId(null);
            roomMemberRepository.save(target);

            // Record in kicked users list so they cannot rejoin
            kickedUserRepository.save(KickedUser.builder()
                    .roomId(roomId)
                    .userId(targetUserId)
                    .kickedBy(kickerId)
                    .reason(reason != null ? reason : "Kicked by room admin")
                    .kickedAt(Instant.now())
                    .build());

            roomMetricsService.recordKick();
            long newVersion = incrementRoomVersion(room);

            // Send private notification to the kicked player and broadcast event to room
            eventPublisher.publishEvent(RoomEvent.builder()
                    .type(RoomEventType.PLAYER_KICKED)
                    .roomId(roomId)
                    .version(newVersion)
                    .targetUserId(targetUserId)
                    .data(Map.of(
                            "userId", targetUserId,
                            "username", targetUsername,
                            "kickedBy", kickerId,
                            "reason", reason != null ? reason : "Kicked by room admin"
                    ))
                    .build());

            log.info("Admin {} kicked user {} from room {}", kickerId, targetUsername, room.getRoomCode());
        } else {
            throw new UnauthorizedRoomActionException("You are not authorized to kick players from the room");
        }
    }

    @Transactional(readOnly = true)
    public RoomSnapshotDto getRoomSnapshot(String identifier) {
        return getRoomSnapshot(identifier, null);
    }

    @Transactional(readOnly = true)
    public RoomSnapshotDto getRoomSnapshot(String identifier, UUID viewerUserId) {
        Room room = resolveRoom(identifier);
        return getRoomSnapshot(room.getId(), viewerUserId);
    }

    @Transactional(readOnly = true)
    public RoomSnapshotDto getRoomSnapshot(UUID roomId) {
        return getRoomSnapshot(roomId, null);
    }

    @Transactional
    public RoomSnapshotDto getRoomSnapshot(UUID roomId, UUID viewerUserId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RoomNotFoundException("Room not found with ID: " + roomId));

        // Auto-end contest if time limit reached
        if (room.getStatus() == RoomStatus.IN_PROGRESS && room.getEndsAt() != null && Instant.now().isAfter(room.getEndsAt())) {
            Instant now = Instant.now();
            room.setStatus(RoomStatus.ENDED);
            room.setUpdatedAt(now);
            roomRepository.save(room);
            long newVersion = incrementRoomVersion(room);
            eventPublisher.publishEvent(RoomEvent.builder()
                    .type(RoomEventType.ROOM_ENDED)
                    .roomId(room.getId())
                    .roomCode(room.getRoomCode())
                    .version(newVersion)
                    .data(Map.of("status", RoomStatus.ENDED, "endedAt", now, "reason", "Contest timer expired"))
                    .build());
            log.info("Room {} contest ended upon snapshot check because timer expired", room.getRoomCode());
        }

        List<RoomMember> activeMembers = roomMemberRepository.findByRoomIdAndStatus(roomId, MemberStatus.ACTIVE);
        List<Team> teams = teamRepository.findByRoomId(roomId);

        // Batch resolve usernames
        Set<UUID> userIds = activeMembers.stream().map(RoomMember::getUserId).collect(Collectors.toSet());
        Map<UUID, String> userNames = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, User::getUsername));

        Map<UUID, List<MemberDto>> teamMembersMap = new HashMap<>();
        List<MemberDto> unassignedPlayers = new ArrayList<>();
        List<MemberDto> allMemberDtos = new ArrayList<>();

        for (RoomMember member : activeMembers) {
            String uname = userNames.getOrDefault(member.getUserId(), "Unknown");
            MemberDto dto = toMemberDto(member, uname);
            allMemberDtos.add(dto);

            if (member.getTeamId() != null) {
                teamMembersMap.computeIfAbsent(member.getTeamId(), k -> new ArrayList<>()).add(dto);
            } else {
                unassignedPlayers.add(dto);
            }
        }

        List<TeamDto> teamDtos = teams.stream().map(t -> {
            boolean isMemberOfThisTeam = viewerUserId != null && activeMembers.stream()
                    .anyMatch(m -> m.getUserId().equals(viewerUserId) && t.getId().equals(m.getTeamId()));

            String visibleTeamCode = isMemberOfThisTeam ? t.getCode() : null;

            return TeamDto.builder()
                    .id(t.getId())
                    .roomId(t.getRoomId())
                    .code(visibleTeamCode)
                    .teamCode(visibleTeamCode)
                    .name(t.getName())
                    .teamName(t.getName())
                    .leaderId(t.getLeaderId())
                    .leaderUserId(t.getLeaderId())
                    .memberCount(t.getMemberCount())
                    .members(teamMembersMap.getOrDefault(t.getId(), Collections.emptyList()))
                    .createdAt(t.getCreatedAt())
                    .build();
        }).toList();

        boolean isRoomMemberOrAdmin = viewerUserId == null ||
                room.getAdminId().equals(viewerUserId) ||
                activeMembers.stream().anyMatch(m -> m.getUserId().equals(viewerUserId));

        String visibleRoomCode = isRoomMemberOrAdmin ? room.getRoomCode() : null;

        RoomDto roomDto = RoomDto.fromEntity(room);
        if (!isRoomMemberOrAdmin) {
            roomDto.setRoomCode(null);
        }

        return RoomSnapshotDto.builder()
                .type("ROOM_SNAPSHOT")
                .roomCode(visibleRoomCode)
                .version(room.getVersion())
                .sentAt(Instant.now())
                .room(roomDto)
                .teams(teamDtos)
                .members(allMemberDtos)
                .unassigned(unassignedPlayers)
                .unassignedPlayers(unassignedPlayers)
                .build();
    }

    private void dissolveTeamInternal(Room room, Team team) {
        List<RoomMember> teamMembers = roomMemberRepository.findByTeamId(team.getId());
        for (RoomMember m : teamMembers) {
            m.setTeamId(null);
            m.setRole(MemberRole.MEMBER);
        }
        roomMemberRepository.saveAll(teamMembers);
        teamRepository.delete(team);

        long newVersion = incrementRoomVersion(room);

        eventPublisher.publishEvent(RoomEvent.builder()
                .type(RoomEventType.TEAM_DISSOLVED)
                .roomId(room.getId())
                .version(newVersion)
                .data(Map.of(
                        "teamId", team.getId(),
                        "teamName", team.getName(),
                        "teamCode", team.getCode()
                ))
                .build());

        log.info("Team {} ({}) in room {} was dissolved", team.getName(), team.getCode(), room.getRoomCode());
    }

    private long incrementRoomVersion(Room room) {
        return roomRepository.incrementAndGetVersion(room.getId());
    }

    private String generateUniqueRoomCode() {
        for (int i = 0; i < 20; i++) {
            StringBuilder sb = new StringBuilder(6);
            for (int j = 0; j < 6; j++) {
                sb.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
            }
            String code = sb.toString();
            if (!roomRepository.existsByRoomCode(code)) {
                return code;
            }
        }
        return UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String resolveUsername(UUID userId) {
        return userRepository.findById(userId)
                .map(User::getUsername)
                .orElse("Unknown");
    }

    @Transactional
    public ActiveRoomDto getActiveRoomForUser(UUID userId) {
        List<RoomMember> memberships = roomMemberRepository.findByUserIdAndStatus(userId, MemberStatus.ACTIVE);
        for (RoomMember member : memberships) {
            Optional<Room> roomOpt = roomRepository.findById(member.getRoomId());
            if (roomOpt.isPresent()) {
                Room room = roomOpt.get();
                if (room.getStatus() == RoomStatus.WAITING || room.getStatus() == RoomStatus.IN_PROGRESS) {
                    // Check if time expired
                    if (room.getStatus() == RoomStatus.IN_PROGRESS && room.getEndsAt() != null && Instant.now().isAfter(room.getEndsAt())) {
                        Instant now = Instant.now();
                        room.setStatus(RoomStatus.ENDED);
                        room.setUpdatedAt(now);
                        roomRepository.save(room);
                        eventPublisher.publishEvent(RoomEvent.builder()
                                .type(RoomEventType.ROOM_ENDED)
                                .roomId(room.getId())
                                .roomCode(room.getRoomCode())
                                .version(incrementRoomVersion(room))
                                .data(Map.of("status", RoomStatus.ENDED, "endedAt", now, "reason", "Contest timer expired"))
                                .build());
                        member.setStatus(MemberStatus.LEFT);
                        roomMemberRepository.save(member);
                        continue;
                    }

                    return ActiveRoomDto.builder()
                            .hasActiveRoom(true)
                            .roomId(room.getId())
                            .roomCode(room.getRoomCode())
                            .roomName(room.getRoomName())
                            .mode(room.getMode())
                            .status(room.getStatus())
                            .startedAt(room.getStartedAt())
                            .endsAt(room.getEndsAt())
                            .route("/rooms/" + room.getRoomCode())
                            .build();
                } else {
                    member.setStatus(MemberStatus.LEFT);
                    roomMemberRepository.save(member);
                }
            }
        }
        return ActiveRoomDto.builder().hasActiveRoom(false).build();
    }

    @Scheduled(fixedDelay = 3000)
    @Transactional
    public void autoEndExpiredContests() {
        List<Room> activeRooms = roomRepository.findAll().stream()
                .filter(r -> r.getStatus() == RoomStatus.IN_PROGRESS && r.getEndsAt() != null)
                .toList();

        Instant now = Instant.now();
        for (Room room : activeRooms) {
            if (now.isAfter(room.getEndsAt())) {
                room.setStatus(RoomStatus.ENDED);
                room.setUpdatedAt(now);
                roomRepository.save(room);
                long newVersion = incrementRoomVersion(room);
                eventPublisher.publishEvent(RoomEvent.builder()
                        .type(RoomEventType.ROOM_ENDED)
                        .roomId(room.getId())
                        .roomCode(room.getRoomCode())
                        .version(newVersion)
                        .data(Map.of("status", RoomStatus.ENDED, "endedAt", now, "reason", "Contest duration ended"))
                        .build());
                log.info("Room {} contest automatically ended because timer expired", room.getRoomCode());
            }
        }
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
}
