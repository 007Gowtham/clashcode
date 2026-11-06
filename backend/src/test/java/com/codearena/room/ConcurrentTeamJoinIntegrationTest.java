package com.codearena.room;

import com.codearena.auth.entity.User;
import com.codearena.auth.repository.UserRepository;
import com.codearena.room.domain.MemberRole;
import com.codearena.room.domain.MemberStatus;
import com.codearena.room.domain.Room;
import com.codearena.room.domain.RoomMember;
import com.codearena.room.domain.RoomMode;
import com.codearena.room.domain.RoomStatus;
import com.codearena.room.domain.Team;
import com.codearena.room.dto.JoinTeamRequest;
import com.codearena.room.exception.TeamFullException;
import com.codearena.room.repository.RoomMemberRepository;
import com.codearena.room.repository.RoomRepository;
import com.codearena.room.repository.TeamRepository;
import com.codearena.room.service.TeamService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class ConcurrentTeamJoinIntegrationTest {

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

    @BeforeEach
    void setUp() {
        roomMemberRepository.deleteAll();
        teamRepository.deleteAll();
        roomRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Concurrency: Simultaneous joins to one team never exceed 4 members")
    void testConcurrentJoinsNeverExceedCapacity() throws Exception {
        // 1. Create Room Admin and Room in TEAM mode
        UUID adminId = UUID.randomUUID();
        userRepository.save(User.builder()
                .id(adminId)
                .username("admin_user")
                .email("admin@test.com")
                .passwordHash("hashed")
                .createdAt(Instant.now())
                .build());

        Room room = roomRepository.save(Room.builder()
                .roomCode("CONCUR")
                .roomName("Concurrent Arena")
                .adminId(adminId)
                .mode(RoomMode.TEAM)
                .status(RoomStatus.WAITING)
                .maxPlayers(20)
                .version(1L)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build());

        // 2. Create Team Leader and Team (Initial memberCount = 1, so exactly 3 spots left)
        UUID leaderId = UUID.randomUUID();
        userRepository.save(User.builder()
                .id(leaderId)
                .username("team_leader")
                .email("leader@test.com")
                .passwordHash("hashed")
                .createdAt(Instant.now())
                .build());

        roomMemberRepository.save(RoomMember.builder()
                .roomId(room.getId())
                .userId(leaderId)
                .role(MemberRole.ADMIN)
                .status(MemberStatus.ACTIVE)
                .joinedAt(Instant.now())
                .build());

        Team team = teamRepository.save(Team.builder()
                .roomId(room.getId())
                .code("TEAM01")
                .name("AtomicSquad")
                .leaderId(leaderId)
                .memberCount(1)
                .createdAt(Instant.now())
                .build());

        // Set leader's teamId
        RoomMember leaderMember = roomMemberRepository.findByRoomIdAndUserId(room.getId(), leaderId).orElseThrow();
        leaderMember.setTeamId(team.getId());
        leaderMember.setRole(MemberRole.LEADER);
        roomMemberRepository.save(leaderMember);

        // 3. Create 10 unassigned active players in this room
        int concurrentCandidates = 10;
        List<UUID> candidateIds = new ArrayList<>();
        for (int i = 1; i <= concurrentCandidates; i++) {
            UUID candId = UUID.randomUUID();
            userRepository.save(User.builder()
                    .id(candId)
                    .username("candidate_" + i)
                    .email("cand" + i + "@test.com")
                    .passwordHash("hashed")
                    .createdAt(Instant.now())
                    .build());

            roomMemberRepository.save(RoomMember.builder()
                    .roomId(room.getId())
                    .userId(candId)
                    .teamId(null)
                    .role(MemberRole.MEMBER)
                    .status(MemberStatus.ACTIVE)
                    .joinedAt(Instant.now())
                    .build());

            candidateIds.add(candId);
        }

        // 4. Launch 10 simultaneous join requests using CountDownLatch
        ExecutorService executor = Executors.newFixedThreadPool(concurrentCandidates);
        CountDownLatch readyLatch = new CountDownLatch(concurrentCandidates);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch finishLatch = new CountDownLatch(concurrentCandidates);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger fullExceptionCount = new AtomicInteger(0);
        List<Throwable> unexpectedExceptions = Collections.synchronizedList(new ArrayList<>());

        JoinTeamRequest joinRequest = JoinTeamRequest.builder().teamCode("TEAM01").build();

        for (UUID candId : candidateIds) {
            executor.submit(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await(); // wait for simultaneous trigger
                    teamService.joinTeam(room.getId(), joinRequest, candId);
                    successCount.incrementAndGet();
                } catch (TeamFullException e) {
                    fullExceptionCount.incrementAndGet();
                } catch (Throwable t) {
                    unexpectedExceptions.add(t);
                } finally {
                    finishLatch.countDown();
                }
            });
        }

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown(); // fire all threads at the exact same instant
        boolean finished = finishLatch.await(15, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(finished).isTrue();
        assertThat(unexpectedExceptions).isEmpty();

        // Exactly 3 spots were available (1 leader + 3 members = 4 max)
        assertThat(successCount.get()).isEqualTo(3);
        assertThat(fullExceptionCount.get()).isEqualTo(7);

        // Verify database state: team member count must be exactly 4
        Team updatedTeam = teamRepository.findById(team.getId()).orElseThrow();
        assertThat(updatedTeam.getMemberCount()).isEqualTo(4);

        long activeMembersInDb = roomMemberRepository.countByTeamIdAndStatus(team.getId(), MemberStatus.ACTIVE);
        assertThat(activeMembersInDb).isEqualTo(4);
    }
}

