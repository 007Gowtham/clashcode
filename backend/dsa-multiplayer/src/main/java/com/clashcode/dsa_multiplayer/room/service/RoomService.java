package com.clashcode.dsa_multiplayer.room.service;

import com.clashcode.dsa_multiplayer.auth.entity.User;
import com.clashcode.dsa_multiplayer.auth.repository.UserRepository;
import com.clashcode.dsa_multiplayer.common.exception.ApiException;
import com.clashcode.dsa_multiplayer.room.dto.CreateRoomRequest;
import com.clashcode.dsa_multiplayer.room.dto.JoinRoomRequest;
import com.clashcode.dsa_multiplayer.room.dto.RoomResponse;
import com.clashcode.dsa_multiplayer.room.entity.Room;
import com.clashcode.dsa_multiplayer.room.entity.RoomProblem;
import com.clashcode.dsa_multiplayer.room.entity.RoomStatus;
import com.clashcode.dsa_multiplayer.room.repository.RoomProblemRepository;
import com.clashcode.dsa_multiplayer.room.repository.RoomRepository;
import com.clashcode.dsa_multiplayer.submission.dto.ProblemResponse;
import com.clashcode.dsa_multiplayer.submission.entity.Problem;
import com.clashcode.dsa_multiplayer.submission.repository.ProblemRepository;
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

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final ProblemRepository problemRepository;
    private final RoomProblemRepository roomProblemRepository;
    private final com.clashcode.dsa_multiplayer.submission.repository.SubmissionRepository submissionRepository;
<<<<<<< HEAD
=======
    private final com.clashcode.dsa_multiplayer.common.service.WebSocketService webSocketService;
>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7

    @Transactional
    public RoomResponse createRoom(CreateRoomRequest request, User admin) {
        // Refresh admin entity from db to avoid stale session state
        User currentAdmin = userRepository.findById(admin.getId())
                .orElseThrow(() -> new ApiException("USER_NOT_FOUND: User not found", HttpStatus.NOT_FOUND));

        if (currentAdmin.getActiveRoomId() != null) {
            throw new ApiException("ALREADY_IN_ROOM: You are already in a room", HttpStatus.BAD_REQUEST);
        }

        String code = generateUniqueCode();
        Room room = Room.builder()
                .code(code)
                .name(request.getName())
                .admin(currentAdmin)
                .status(RoomStatus.WAITING)
                .difficulty(request.getDifficulty().toUpperCase())
                .questionsPerUser(request.getQuestionsPerUser())
                .maxTeamSize(request.getMaxTeamSize())
                .timeLimitMinutes(request.getTimeLimitMinutes())
                .build();

        room = roomRepository.save(room);

        currentAdmin.setActiveRoomId(room.getId());
        userRepository.save(currentAdmin);

        log.info("Room created: {} with code {} by admin {}", room.getName(), room.getCode(), currentAdmin.getUsername());
        return convertToRoomResponse(room);
    }

    public List<RoomResponse> listActiveRooms() {
        return roomRepository.findByStatusNot(RoomStatus.ENDED)
                .stream()
                .map(this::convertToRoomResponse)
                .collect(Collectors.toList());
    }

    public RoomResponse getRoomById(UUID roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ApiException("ROOM_NOT_FOUND: Room not found", HttpStatus.NOT_FOUND));
        return convertToRoomResponse(room);
    }

    @Transactional
    public RoomResponse joinRoom(JoinRoomRequest request, User user) {
        User currentUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new ApiException("USER_NOT_FOUND: User not found", HttpStatus.NOT_FOUND));

        if (currentUser.getActiveRoomId() != null) {
            throw new ApiException("ALREADY_IN_ROOM: You are already in a room", HttpStatus.BAD_REQUEST);
        }

        Room room = roomRepository.findByCode(request.getCode().toUpperCase())
                .orElseThrow(() -> new ApiException("ROOM_NOT_FOUND: Room not found", HttpStatus.NOT_FOUND));

        if (room.getStatus() != RoomStatus.WAITING) {
            throw new ApiException("ROOM_NOT_AVAILABLE: Room is not available (already started or ended)", HttpStatus.BAD_REQUEST);
        }

        currentUser.setActiveRoomId(room.getId());
        userRepository.save(currentUser);

        log.info("User {} joined room {}", currentUser.getUsername(), room.getCode());
        return convertToRoomResponse(room);
    }

    @Transactional
    public void leaveRoom(User user) {
        User currentUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new ApiException("USER_NOT_FOUND: User not found", HttpStatus.NOT_FOUND));

        if (currentUser.getActiveRoomId() == null) {
            throw new ApiException("NOT_IN_ROOM: You are not in a room", HttpStatus.BAD_REQUEST);
        }

        Room room = roomRepository.findById(currentUser.getActiveRoomId())
                .orElse(null);

        if (room == null) {
            currentUser.setActiveRoomId(null);
            currentUser.setCurrentTeamId(null);
            userRepository.save(currentUser);
            return;
        }

        if (room.getAdmin().getId().equals(currentUser.getId())) {
            // Admin leaving disbands the room
            log.info("Admin leaving room {}. Disbanding room.", room.getCode());
            List<User> members = userRepository.findByActiveRoomId(room.getId());
            for (User member : members) {
                member.setActiveRoomId(null);
                member.setCurrentTeamId(null);
                userRepository.save(member);
            }
            
            // Explicitly delete child teams and team members first to prevent constraint violations
            List<Team> teams = teamRepository.findByRoomId(room.getId());
            for (Team team : teams) {
                List<TeamMember> teamMembers = teamMemberRepository.findByTeamId(team.getId());
                teamMemberRepository.deleteAll(teamMembers);
            }
            teamRepository.deleteAll(teams);
            
            roomRepository.delete(room);
        } else {
            // Regular member leaving
            if (currentUser.getCurrentTeamId() != null) {
                leaveTeamInternal(currentUser);
            }
            currentUser.setActiveRoomId(null);
            userRepository.save(currentUser);
            log.info("User {} left room {}", currentUser.getUsername(), room.getCode());
        }
    }

    @Transactional
    public RoomResponse startContest(UUID roomId, User admin) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ApiException("ROOM_NOT_FOUND: Room not found", HttpStatus.NOT_FOUND));

        if (!room.getAdmin().getId().equals(admin.getId())) {
            throw new ApiException("FORBIDDEN: Only the room admin can start the contest", HttpStatus.FORBIDDEN);
        }

        if (room.getStatus() != RoomStatus.WAITING) {
            throw new ApiException("BAD_REQUEST: Contest has already started or ended", HttpStatus.BAD_REQUEST);
        }

        List<Team> teams = teamRepository.findByRoomId(roomId);
        if (teams.isEmpty()) {
            throw new ApiException("BAD_REQUEST: Cannot start contest without any teams", HttpStatus.BAD_REQUEST);
        }

        if (!teams.stream().allMatch(Team::isReady)) {
            throw new ApiException("BAD_REQUEST: All players must be ready before starting the contest", HttpStatus.BAD_REQUEST);
        }
        // Assign random problems matching the room's difficulty
        assignProblemsToRoom(room);

        room.setStatus(RoomStatus.IN_PROGRESS);
        room.setStartTime(Instant.now());
        room.setEndTime(Instant.now().plusSeconds(room.getTimeLimitMinutes() * 60L));
        room = roomRepository.save(room);

<<<<<<< HEAD
=======
        // Broadcast start event to all clients in the room
        Map<String, Object> event = new HashMap<>();
        event.put("type", "ROOM_STARTED");
        event.put("roomId", roomId.toString());
        event.put("endTime", room.getEndTime().toString());
        webSocketService.push("/topic/room/" + roomId + "/events", event);

>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7
        log.info("Contest started for room {} with {} problems assigned",
                room.getCode(), room.getQuestionsPerUser());
        return convertToRoomResponse(room);
    }

    /**
     * Picks questionsPerUser random problems matching the room difficulty
     * and saves them as RoomProblem records.
     * If not enough problems exist for that difficulty, falls back to any difficulty.
     */
    private void assignProblemsToRoom(Room room) {
        List<Problem> pool = problemRepository.findByDifficultyIgnoreCase(room.getDifficulty());
        if (pool.isEmpty()) {
            // Fallback: any difficulty
            pool = problemRepository.findAll();
        }
        if (pool.isEmpty()) {
            log.warn("No problems available to assign to room {}. Contest will start with no problems.", room.getCode());
            return;
        }

        Collections.shuffle(pool);
        int count = Math.min(room.getQuestionsPerUser(), pool.size());
        for (int i = 0; i < count; i++) {
            RoomProblem rp = RoomProblem.builder()
                    .room(room)
                    .problem(pool.get(i))
                    .position(i)
                    .build();
            roomProblemRepository.save(rp);
        }
    }

    @Transactional
    public RoomResponse endContest(UUID roomId, User admin) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ApiException("ROOM_NOT_FOUND: Room not found", HttpStatus.NOT_FOUND));

        if (!room.getAdmin().getId().equals(admin.getId())) {
            throw new ApiException("FORBIDDEN: Only the room admin can end the contest", HttpStatus.FORBIDDEN);
        }

        if (room.getStatus() != RoomStatus.IN_PROGRESS) {
            throw new ApiException("BAD_REQUEST: Room is not in progress", HttpStatus.BAD_REQUEST);
        }

        room.setStatus(RoomStatus.ENDED);
        room.setEndTime(Instant.now());
        room = roomRepository.save(room);

        // Reset user activeRoomId and currentTeamId
        List<User> members = userRepository.findByActiveRoomId(roomId);
        for (User member : members) {
            member.setActiveRoomId(null);
            member.setCurrentTeamId(null);
            userRepository.save(member);
        }

        log.info("Contest ended for room {}", room.getCode());
        return convertToRoomResponse(room);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Returns the problems assigned to a room (for battle page).
     * Shape: { questions: [ProblemResponse], endTime: Instant }
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getRoomQuestions(UUID roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ApiException("ROOM_NOT_FOUND: Room not found", HttpStatus.NOT_FOUND));

        List<RoomProblem> roomProblems = roomProblemRepository.findByRoomIdOrderByPosition(roomId);
        List<ProblemResponse> problems = roomProblems.stream()
                .map(rp -> ProblemResponse.from(rp.getProblem()))
                .collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("questions", problems);
        result.put("endTime", room.getEndTime());
        return result;
    }

    /**
     * Clean up ENDED rooms that are older than 1 hour to prevent database bloat.
     * Runs every 5 minutes (300000 ms).
     */
    @org.springframework.scheduling.annotation.Scheduled(fixedRate = 300000)
    @Transactional
    public void cleanupOldEndedRooms() {
        Instant cutoff = Instant.now().minusSeconds(3600); // 1 hour ago
        List<Room> oldRooms = roomRepository.findByStatus(RoomStatus.ENDED).stream()
                .filter(r -> r.getEndTime() != null && r.getEndTime().isBefore(cutoff))
                .collect(Collectors.toList());

        for (Room room : oldRooms) {
            log.info("Cleaning up old ENDED room: {} (ID: {})", room.getCode(), room.getId());
            submissionRepository.deleteByRoomId(room.getId());
            teamMemberRepository.deleteByTeamRoomId(room.getId());
            teamRepository.deleteByRoomId(room.getId());
            roomProblemRepository.deleteByRoomId(room.getId());
            roomRepository.delete(room);
        }
    }

    /**
     * Returns a leaderboard sorted by team score descending.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getRoomLeaderboard(UUID roomId) {
        List<Team> teams = teamRepository.findByRoomId(roomId);
<<<<<<< HEAD
=======
        List<com.clashcode.dsa_multiplayer.submission.entity.Submission> acceptedSubmissions = 
            submissionRepository.findByRoomIdOrderBySubmittedAtDesc(roomId).stream()
                .filter(s -> s.getStatus() == com.clashcode.dsa_multiplayer.submission.entity.SubmissionStatus.ACCEPTED)
                .collect(Collectors.toList());

>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7
        return teams.stream()
                .sorted(Comparator.comparingInt(Team::getScore).reversed())
                .map(t -> {
                    Map<String, Object> entry = new LinkedHashMap<>();
                    entry.put("teamId", t.getId());
                    entry.put("teamName", t.getName());
                    entry.put("score", t.getScore());
<<<<<<< HEAD
=======
                    
                    List<com.clashcode.dsa_multiplayer.team.entity.TeamMember> teamMembers = teamMemberRepository.findByTeamId(t.getId());
                    List<Map<String, Object>> memberScores = teamMembers.stream()
                        .map(tm -> {
                            User u = tm.getUser();
                            Set<UUID> solvedProblems = new HashSet<>();
                            int userScore = 0;
                            for (com.clashcode.dsa_multiplayer.submission.entity.Submission s : acceptedSubmissions) {
                                if (s.getUser().getId().equals(u.getId())) {
                                    if (solvedProblems.add(s.getProblem().getId())) {
                                        userScore += pointsForDifficulty(s.getProblem().getDifficulty());
                                    }
                                }
                            }
                            
                            Map<String, Object> mEntry = new LinkedHashMap<>();
                            mEntry.put("userId", u.getId());
                            mEntry.put("username", u.getUsername());
                            mEntry.put("score", userScore);
                            return mEntry;
                        })
                        .collect(Collectors.toList());
                    
                    entry.put("members", memberScores);
                    entry.put("memberCount", teamMembers.size());
>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7
                    return entry;
                })
                .collect(Collectors.toList());
    }

<<<<<<< HEAD
=======
    private int pointsForDifficulty(String difficulty) {
        return switch (difficulty != null ? difficulty.toUpperCase() : "") {
            case "EASY"   -> 10;
            case "MEDIUM" -> 30;
            case "HARD"   -> 50;
            default       -> 0;
        };
    }

>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7
    public RoomResponse convertToRoomResponse(Room room) {
        List<User> roomUsers = userRepository.findByActiveRoomId(room.getId());
        List<RoomResponse.MemberResponse> members = roomUsers.stream()
                .map(u -> RoomResponse.MemberResponse.builder()
                        .id(u.getId())
                        .username(u.getUsername())
                        .email(u.getEmail())
                        .build())
                .collect(Collectors.toList());

        List<Team> roomTeams = teamRepository.findByRoomId(room.getId());
        List<TeamResponse> teams = roomTeams.stream()
                .map(t -> {
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
                })
                .collect(Collectors.toList());

        return RoomResponse.builder()
                .id(room.getId())
                .code(room.getCode())
                .name(room.getName())
                .adminId(room.getAdmin().getId())
                .adminUsername(room.getAdmin().getUsername())
                .status(room.getStatus())
                .difficulty(room.getDifficulty())
                .questionsPerUser(room.getQuestionsPerUser())
                .maxTeamSize(room.getMaxTeamSize())
                .timeLimitMinutes(room.getTimeLimitMinutes())
                .startTime(room.getStartTime())
                .endTime(room.getEndTime())
                .members(members)
                .teams(teams)
                .build();
    }

    private void leaveTeamInternal(User user) {
        if (user.getCurrentTeamId() == null) return;

        TeamMember member = teamMemberRepository.findByUserId(user.getId()).orElse(null);
        if (member != null) {
            Team team = member.getTeam();
            if (team.getLeader().getId().equals(user.getId())) {
                List<TeamMember> members = teamMemberRepository.findByTeamId(team.getId());
                for (TeamMember m : members) {
                    User u = m.getUser();
                    u.setCurrentTeamId(null);
                    userRepository.save(u);
                }
                teamRepository.delete(team);
            } else {
                teamMemberRepository.delete(member);
                user.setCurrentTeamId(null);
                userRepository.save(user);

                List<TeamMember> remainingMembers = teamMemberRepository.findByTeamId(team.getId());
                boolean allReady = !remainingMembers.isEmpty() && remainingMembers.stream().allMatch(TeamMember::isReady);
                team.setReady(allReady);
                teamRepository.save(team);
            }
        } else {
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
            if (roomRepository.findByCode(code).isEmpty()) {
                return code;
            }
        }
    }
}
