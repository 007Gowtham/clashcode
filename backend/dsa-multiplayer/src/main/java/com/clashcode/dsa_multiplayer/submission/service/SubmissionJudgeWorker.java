package com.clashcode.dsa_multiplayer.submission.service;

import com.clashcode.dsa_multiplayer.common.service.WebSocketService;
import com.clashcode.dsa_multiplayer.room.service.RoomService;
import com.clashcode.dsa_multiplayer.submission.dto.JudgeMessage;
import com.clashcode.dsa_multiplayer.submission.entity.Submission;
import com.clashcode.dsa_multiplayer.submission.entity.SubmissionStatus;
import com.clashcode.dsa_multiplayer.submission.repository.SubmissionRepository;
import com.clashcode.dsa_multiplayer.submission.sandbox.SandboxService;
import com.clashcode.dsa_multiplayer.team.repository.TeamMemberRepository;
import com.clashcode.dsa_multiplayer.team.repository.TeamRepository;
import io.awspring.cloud.sqs.annotation.SqsListener;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class SubmissionJudgeWorker {

    private final SubmissionRepository submissionRepo;
    private final SandboxService sandbox;
    private final TeamRepository teamRepo;
    private final TeamMemberRepository teamMemberRepository;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;
    private final WebSocketService webSocketService;
    private final RoomService roomService;

    @SqsListener("${app.sqs.judge-queue}")
    @Transactional
    public void onJudgeMessage(String payload) {
        JudgeMessage message;
        try {
            message = objectMapper.readValue(payload, JudgeMessage.class);
        } catch (Exception e) {
            log.error("Failed to parse SQS message payload: {}", payload, e);
            return;
        }
        // 1. fetch the submission — if deleted, skip silently
        Submission submission = submissionRepo.findById(message.getSubmissionId()).orElse(null);
        if (submission == null) {
            log.warn("Submission {} not found — dropping message", message.getSubmissionId());
            return;
        }

        // 2. get the problem directly off the submission entity
        var problem = submission.getProblem();

        // 3. run the judge engine — all test cases (sampleOnly = false)
        SubmissionJudgeEngine.JudgeResult result = SubmissionJudgeEngine.judge(
                sandbox, problem, submission.getLanguage(), submission.getCode(), false);

        // 4. save the verdict back
        submission.setStatus(result.status());
        submission.setResult(result.resultMap());
        submission.setExecutionTimeMs((int) result.maxTimeMs());
        submissionRepo.save(submission);

        log.info("Submission {} judged: {} ({} ms)",
                submission.getId(), result.status(), result.maxTimeMs());

        // 5. push real-time verdict to the browser via STOMP WebSocket
        //    DB is consistent here — submissionRepo.save() was already called.
        Map<String, Object> wsPayload = new LinkedHashMap<>();
        wsPayload.put("submissionId",    submission.getId());
        wsPayload.put("status",          result.status().name());
        wsPayload.put("executionTimeMs", result.maxTimeMs());
        // count passed / total test cases from result map (best-effort)
        int passed = 0, total = 0;
        Object trObj = result.resultMap().get("testResults");
        if (trObj instanceof List<?> trList) {
            total = trList.size();
            for (Object item : trList) {
                if (item instanceof Map<?, ?> tr && Boolean.TRUE.equals(tr.get("passed"))) passed++;
            }
        }
        wsPayload.put("passed", passed);
        wsPayload.put("total",  total);
        webSocketService.push("/topic/submission/" + submission.getId(), wsPayload);

        // 6. award team score if accepted and inside a room
        if (result.status() == SubmissionStatus.ACCEPTED
                && submission.getRoom() != null
                && submission.getUser().getCurrentTeamId() != null) {
            awardTeamScore(submission);
        }
    }


    private void awardTeamScore(Submission submission) {
        teamRepo.findById(submission.getUser().getCurrentTeamId()).ifPresent(team -> {
            List<UUID> memberIds = teamMemberRepository
                    .findByTeamId(team.getId())
                    .stream()
                    .map(tm -> tm.getUser().getId())
                    .toList();

            // recompute total score from scratch — counts each problem once
            // even if multiple teammates solved it
            List<Submission> teamAccepted = submissionRepo
                    .findByRoomIdOrderBySubmittedAtDesc(submission.getRoom().getId())
                    .stream()
                    .filter(s -> memberIds.contains(s.getUser().getId()))
                    .filter(s -> s.getStatus() == SubmissionStatus.ACCEPTED)
                    .toList();

            Set<UUID> uniqueProblems = new HashSet<>();
            int totalScore = 0;
            for (Submission s : teamAccepted) {
                if (uniqueProblems.add(s.getProblem().getId())) {
                    totalScore += pointsFor(s.getProblem().getDifficulty());
                }
            }

            team.setScore(totalScore);
            teamRepo.save(team);

            log.info("Team {} score updated to {}", team.getId(), totalScore);

            // Push the updated leaderboard to all clients in the room via WebSocket.
            // Frontend subscribes to /topic/room/{roomId}/leaderboard
            UUID roomId = submission.getRoom().getId();
            List<Map<String, Object>> leaderboard = roomService.getRoomLeaderboard(roomId);
            webSocketService.push("/topic/room/" + roomId + "/leaderboard", leaderboard);
        });
    }

    private int pointsFor(String difficulty) {
        return switch (difficulty != null ? difficulty.toUpperCase() : "") {
            case "EASY"   -> 10;
            case "MEDIUM" -> 30;
            case "HARD"   -> 50;
            default       -> 20;
        };
    }
}