package com.codearena.problem.service;

import com.codearena.problem.domain.*;
import com.codearena.problem.dto.*;
import com.codearena.problem.exception.ProblemNotFoundException;
import com.codearena.problem.exception.ProblemRuleViolationException;
import com.codearena.problem.exception.UnauthorizedProblemActionException;
import com.codearena.problem.repository.ContestProblemRepository;
import com.codearena.problem.repository.ProblemRepository;
import com.codearena.problem.repository.StarterCodeRepository;
import com.codearena.problem.repository.TestCaseRepository;
import com.codearena.room.domain.MemberStatus;
import com.codearena.room.domain.Room;
import com.codearena.room.domain.RoomStatus;
import com.codearena.room.exception.IllegalRoomStateException;
import com.codearena.room.exception.NotRoomMemberException;
import com.codearena.room.exception.RoomNotFoundException;
import com.codearena.room.repository.RoomMemberRepository;
import com.codearena.room.repository.RoomRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContestProblemService {

    private final ContestProblemRepository contestProblemRepository;
    private final ProblemRepository problemRepository;
    private final TestCaseRepository testCaseRepository;
    private final StarterCodeRepository starterCodeRepository;
    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final ObjectMapper objectMapper;

    /**
     * Admin selects problems for a room contest.
     * Allowed only in WAITING state, and selected problems must be PUBLISHED.
     */
    @Transactional
    public List<ContestProblemResponse> selectProblemsForRoom(UUID roomId, SelectRoomProblemsRequest request, UUID userId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RoomNotFoundException("Room not found with ID: " + roomId));

        if (!room.getAdminId().equals(userId)) {
            throw new UnauthorizedProblemActionException("Only room admin can select contest problems");
        }

        if (room.getStatus() != RoomStatus.WAITING) {
            throw new IllegalRoomStateException("Problems can only be selected while room is in WAITING state");
        }

        List<UUID> problemIds = request.getProblemIds();
        List<Problem> selectedProblems = new ArrayList<>();

        for (UUID pid : problemIds) {
            Problem p = problemRepository.findById(pid)
                    .orElseThrow(() -> new ProblemNotFoundException("Problem not found with ID: " + pid));

            if (p.getStatus() != ProblemStatus.PUBLISHED) {
                throw new ProblemRuleViolationException(
                        "Cannot select problem '" + p.getTitle() + "' because it is not PUBLISHED. Status: " + p.getStatus());
            }

            selectedProblems.add(p);
        }

        // Replace any existing problem selections
        contestProblemRepository.deleteByRoomId(roomId);

        List<ContestProblem> savedList = new ArrayList<>();
        for (int i = 0; i < selectedProblems.size(); i++) {
            Problem p = selectedProblems.get(i);
            ContestProblem cp = ContestProblem.builder()
                    .roomId(roomId)
                    .problemId(p.getId())
                    .orderIndex(i + 1)
                    .points(p.getPoints())
                    .isFrozen(false)
                    .build();

            savedList.add(contestProblemRepository.save(cp));
        }

        log.info("Room {} selected {} contest problems by admin {}", roomId, savedList.size(), userId);
        return savedList.stream().map(this::toContestProblemResponse).toList();
    }

    /**
     * Listens for room events. When a room contest starts, problems are automatically frozen.
     */
    @org.springframework.context.event.EventListener
    public void onRoomEvent(com.codearena.room.event.RoomEvent event) {
        if (event.getType() == com.codearena.room.event.RoomEventType.ROOM_STARTED) {
            log.info("Received ROOM_STARTED event for room {}. Freezing contest problems.", event.getRoomId());
            freezeProblemsForRoom(event.getRoomId());
        }
    }

    /**
     * Freezes all contest problems for a room when the contest starts.
     * Guarantees that any edits to the catalog problems mid-contest will not affect the active contest.
     */
    @Transactional
    public void freezeProblemsForRoom(UUID roomId) {
        List<ContestProblem> contestProblems = contestProblemRepository.findByRoomIdOrderByOrderIndexAsc(roomId);
        if (contestProblems.isEmpty()) {
            log.info("No contest problems selected for room {}. Auto-selecting default published problems.", roomId);
            List<Problem> available = problemRepository.findByStatus(ProblemStatus.PUBLISHED, org.springframework.data.domain.PageRequest.of(0, 4)).getContent();
            if (available.isEmpty()) {
                available = problemRepository.findAll(org.springframework.data.domain.PageRequest.of(0, 4)).getContent();
            }
            int idx = 0;
            for (Problem p : available) {
                ContestProblem cp = ContestProblem.builder()
                        .roomId(roomId)
                        .problemId(p.getId())
                        .orderIndex(idx++)
                        .points(p.getDifficulty() == ProblemDifficulty.HARD ? 300 : (p.getDifficulty() == ProblemDifficulty.MEDIUM ? 200 : 100))
                        .build();
                contestProblems.add(contestProblemRepository.save(cp));
            }
        }

        for (ContestProblem cp : contestProblems) {
            Problem p = problemRepository.findById(cp.getProblemId())
                    .orElseThrow(() -> new ProblemNotFoundException("Problem not found with ID: " + cp.getProblemId()));

            List<StarterCodeDto> starterCodes = starterCodeRepository.findByProblemId(p.getId())
                    .stream()
                    .map(sc -> StarterCodeDto.builder()
                            .language(sc.getLanguage())
                            .templateCode(sc.getTemplateCode())
                            .build())
                    .toList();

            // Strict security: Snapshot ONLY sample test cases. Hidden test cases are NEVER snapshotted into contest problems!
            List<SampleTestCaseDto> sampleTestCases = testCaseRepository
                    .findByProblemIdAndIsSampleTrueOrderByOrderIndexAsc(p.getId())
                    .stream()
                    .map(tc -> SampleTestCaseDto.builder()
                            .id(tc.getId())
                            .input(tc.getInput())
                            .expectedOutput(tc.getExpectedOutput())
                            .orderIndex(tc.getOrderIndex())
                            .build())
                    .toList();

            try {
                cp.setFrozen(true);
                cp.setFrozenTitle(p.getTitle());
                cp.setFrozenSlug(p.getSlug());
                cp.setFrozenStatementMarkdown(p.getStatementMarkdown());
                cp.setFrozenDifficulty(p.getDifficulty().name());
                cp.setFrozenTimeLimitMs(p.getTimeLimitMs());
                cp.setFrozenMemoryLimitMb(p.getMemoryLimitMb());
                cp.setFrozenStarterCodesJson(objectMapper.writeValueAsString(starterCodes));
                cp.setFrozenSampleCasesJson(objectMapper.writeValueAsString(sampleTestCases));
                if (cp.getPoints() <= 0) {
                    cp.setPoints(p.getPoints());
                }

                contestProblemRepository.save(cp);
            } catch (Exception e) {
                log.error("Failed to freeze contest problem {} for room {}", cp.getId(), roomId, e);
                throw new RuntimeException("Failed to freeze contest problem", e);
            }
        }

        log.info("Successfully froze {} contest problems for room {}", contestProblems.size(), roomId);
    }

    /**
     * Retrieves contest problems for members of the room once the contest has started.
     */
    @Transactional(readOnly = true)
    public List<ContestProblemResponse> getContestProblemsForRoom(UUID roomId, UUID userId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RoomNotFoundException("Room not found with ID: " + roomId));

        boolean isMember = roomMemberRepository.existsByRoomIdAndUserIdAndStatus(roomId, userId, MemberStatus.ACTIVE);
        boolean isAdmin = room.getAdminId().equals(userId);

        if (!isMember && !isAdmin) {
            throw new NotRoomMemberException("You are not an active member of room: " + roomId);
        }

        if (room.getStatus() == RoomStatus.WAITING) {
            throw new IllegalRoomStateException("Contest has not started yet. Contest problems are hidden until contest start.");
        }

        List<ContestProblem> contestProblems = contestProblemRepository.findByRoomIdOrderByOrderIndexAsc(roomId);
        return contestProblems.stream().map(this::toContestProblemResponse).toList();
    }

    private ContestProblemResponse toContestProblemResponse(ContestProblem cp) {
        if (cp.isFrozen()) {
            // Read from frozen contest snapshot
            List<StarterCodeDto> starterCodes = deserializeStarterCodes(cp.getFrozenStarterCodesJson());
            List<SampleTestCaseDto> sampleTestCases = deserializeSampleTestCases(cp.getFrozenSampleCasesJson());

            ProblemDifficulty difficulty = ProblemDifficulty.EASY;
            try {
                if (cp.getFrozenDifficulty() != null) {
                    difficulty = ProblemDifficulty.valueOf(cp.getFrozenDifficulty());
                }
            } catch (IllegalArgumentException ignored) {}

            return ContestProblemResponse.builder()
                    .contestProblemId(cp.getId())
                    .roomId(cp.getRoomId())
                    .problemId(cp.getProblemId())
                    .orderIndex(cp.getOrderIndex())
                    .points(cp.getPoints())
                    .title(cp.getFrozenTitle())
                    .slug(cp.getFrozenSlug())
                    .difficulty(difficulty)
                    .statementMarkdown(cp.getFrozenStatementMarkdown())
                    .timeLimitMs(cp.getFrozenTimeLimitMs() != null ? cp.getFrozenTimeLimitMs() : 2000)
                    .memoryLimitMb(cp.getFrozenMemoryLimitMb() != null ? cp.getFrozenMemoryLimitMb() : 256)
                    .starterCodes(starterCodes)
                    .sampleTestCases(sampleTestCases)
                    .build();
        }

        // Live fallback if not frozen yet (e.g. before start)
        Problem p = problemRepository.findById(cp.getProblemId()).orElse(null);
        if (p == null) {
            return ContestProblemResponse.builder()
                    .contestProblemId(cp.getId())
                    .roomId(cp.getRoomId())
                    .problemId(cp.getProblemId())
                    .orderIndex(cp.getOrderIndex())
                    .points(cp.getPoints())
                    .build();
        }

        List<StarterCodeDto> starterCodes = starterCodeRepository.findByProblemId(p.getId())
                .stream()
                .map(sc -> StarterCodeDto.builder()
                        .language(sc.getLanguage())
                        .templateCode(sc.getTemplateCode())
                        .build())
                .toList();

        List<SampleTestCaseDto> sampleTestCases = testCaseRepository
                .findByProblemIdAndIsSampleTrueOrderByOrderIndexAsc(p.getId())
                .stream()
                .map(tc -> SampleTestCaseDto.builder()
                        .id(tc.getId())
                        .input(tc.getInput())
                        .expectedOutput(tc.getExpectedOutput())
                        .orderIndex(tc.getOrderIndex())
                        .build())
                .toList();

        return ContestProblemResponse.builder()
                .contestProblemId(cp.getId())
                .roomId(cp.getRoomId())
                .problemId(cp.getProblemId())
                .orderIndex(cp.getOrderIndex())
                .points(cp.getPoints())
                .title(p.getTitle())
                .slug(p.getSlug())
                .difficulty(p.getDifficulty())
                .statementMarkdown(p.getStatementMarkdown())
                .timeLimitMs(p.getTimeLimitMs())
                .memoryLimitMb(p.getMemoryLimitMb())
                .starterCodes(starterCodes)
                .sampleTestCases(sampleTestCases)
                .build();
    }

    private List<StarterCodeDto> deserializeStarterCodes(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            log.error("Failed to deserialize frozen starter codes JSON", e);
            return List.of();
        }
    }

    private List<SampleTestCaseDto> deserializeSampleTestCases(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            log.error("Failed to deserialize frozen sample cases JSON", e);
            return List.of();
        }
    }
}
