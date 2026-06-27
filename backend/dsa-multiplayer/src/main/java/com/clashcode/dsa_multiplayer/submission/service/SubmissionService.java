package com.clashcode.dsa_multiplayer.submission.service;

import com.clashcode.dsa_multiplayer.auth.entity.User;
import com.clashcode.dsa_multiplayer.common.exception.ApiException;
import com.clashcode.dsa_multiplayer.room.entity.Room;
import com.clashcode.dsa_multiplayer.room.repository.RoomRepository;
import com.clashcode.dsa_multiplayer.submission.dto.RunRequest;
import com.clashcode.dsa_multiplayer.submission.dto.RunResponse;
import com.clashcode.dsa_multiplayer.submission.dto.SubmissionResponse;
import com.clashcode.dsa_multiplayer.submission.dto.SubmitRequest;
import com.clashcode.dsa_multiplayer.submission.entity.Problem;
import com.clashcode.dsa_multiplayer.submission.entity.Submission;
import com.clashcode.dsa_multiplayer.submission.entity.SubmissionStatus;
import com.clashcode.dsa_multiplayer.submission.repository.SubmissionRepository;
import com.clashcode.dsa_multiplayer.submission.sandbox.SandboxRequest;
import com.clashcode.dsa_multiplayer.submission.sandbox.SandboxResult;
import com.clashcode.dsa_multiplayer.submission.sandbox.SandboxService;
import com.clashcode.dsa_multiplayer.team.entity.Team;
import com.clashcode.dsa_multiplayer.team.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubmissionService {

    private final SubmissionRepository submissionRepo;
    private final ProblemService problemService;
    private final RoomRepository roomRepo;
    private final SandboxService sandbox;
    private final TeamRepository teamRepo;
    private final com.clashcode.dsa_multiplayer.team.repository.TeamMemberRepository teamMemberRepository;

    // ── Run (no judge) ────────────────────────────────────────────────────────

    /**
     * Run code against custom input — like "run" in LeetCode.
     * No verdict, no persistence. Pure execution.
     */
    public RunResponse run(RunRequest req, User user) {
        Problem problem = problemService.getEntityById(req.getProblemId());

        JudgeResult result = judge(problem, req.getLanguage(), req.getCode(), true);

        String error = null;
        if (result.resultMap().containsKey("error")) {
            error = (String) result.resultMap().get("error");
        }

        return RunResponse.builder()
                .status(result.status().name())
                .testResults((java.util.List<Map<String, Object>>) result.resultMap().get("testResults"))
                .error(error)
                .executionTimeMs(result.maxTimeMs())
                .compilationError(result.status() == SubmissionStatus.COMPILE_ERROR)
                .build();
    }

    // ── Submit (full judge) ───────────────────────────────────────────────────

    /**
     * Submit code — runs against ALL test cases, persists a Submission record,
     * and returns the full verdict. Same as "submit" in LeetCode.
     */
    @Transactional
    public SubmissionResponse submit(SubmitRequest req, User user) {
        Problem problem = problemService.getEntityById(req.getProblemId());

        Room room = null;
        if (req.getRoomId() != null) {
            room = roomRepo.findById(req.getRoomId())
                    .orElseThrow(() -> new ApiException(
                            "ROOM_NOT_FOUND: Room not found", HttpStatus.NOT_FOUND));
        }

        // Persist submission as PENDING first
        Submission submission = Submission.builder()
                .user(user)
                .problem(problem)
                .room(room)
                .language(req.getLanguage())
                .code(req.getCode())
                .status(SubmissionStatus.PENDING)
                .build();
        final Submission savedSubmission = submissionRepo.save(submission);

        // Run the judge
        JudgeResult judgeResult = judge(problem, req.getLanguage(), req.getCode(), false);

        // Persist final verdict
        savedSubmission.setStatus(judgeResult.status());
        savedSubmission.setResult(judgeResult.resultMap());
        savedSubmission.setExecutionTimeMs((int) judgeResult.maxTimeMs());
        submissionRepo.save(savedSubmission);

        // Award points if accepted and this is the first time this user solved it
        if (judgeResult.status() == SubmissionStatus.ACCEPTED && room != null && user.getCurrentTeamId() != null) {
            final Room finalRoom = room;
            teamRepo.findById(user.getCurrentTeamId()).ifPresent(team -> {
                List<com.clashcode.dsa_multiplayer.team.entity.TeamMember> teamMembers = teamMemberRepository
                        .findByTeamId(team.getId());
                List<UUID> memberIds = teamMembers.stream().map(tm -> tm.getUser().getId()).toList();

                List<Submission> teamAccepted = submissionRepo.findByRoomIdOrderBySubmittedAtDesc(finalRoom.getId())
                        .stream()
                        .filter(s -> memberIds.contains(s.getUser().getId()))
                        .filter(s -> s.getStatus() == SubmissionStatus.ACCEPTED)
                        .toList();

                java.util.Set<UUID> uniqueProblems = new java.util.HashSet<>();
                int totalScore = 0;
                for (Submission s : teamAccepted) {
                    if (uniqueProblems.add(s.getProblem().getId())) {
                        int pts = switch (s.getProblem().getDifficulty() != null
                                ? s.getProblem().getDifficulty().toUpperCase()
                                : "") {
                            case "EASY" -> 10;
                            case "MEDIUM" -> 30;
                            case "HARD" -> 50;
                            default -> 20;
                        };
                        totalScore += pts;
                    }
                }

                // If the current submission is ACCEPTED, ensure it's counted (since it might
                // not be flushed to the DB yet for the query to catch it)
                if (judgeResult.status() == SubmissionStatus.ACCEPTED && uniqueProblems.add(problem.getId())) {
                    int pts = switch (problem.getDifficulty() != null ? problem.getDifficulty().toUpperCase() : "") {
                        case "EASY" -> 10;
                        case "MEDIUM" -> 30;
                        case "HARD" -> 50;
                        default -> 20;
                    };
                    totalScore += pts;
                }

                team.setScore(totalScore);
                teamRepo.save(team);
            });
        }

        log.info("Submission id={} user={} problem={} verdict={}",
                savedSubmission.getId(), user.getId(), problem.getId(), judgeResult.status());

        return SubmissionResponse.from(savedSubmission);
    }

    // ── History ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SubmissionResponse> mySubmissions(User user) {
        return submissionRepo.findByUserIdOrderBySubmittedAtDesc(user.getId())
                .stream().map(SubmissionResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SubmissionResponse> submissionsByRoom(UUID roomId, User user) {
        return submissionRepo.findByRoomIdOrderBySubmittedAtDesc(roomId)
                .stream()
                .filter(s -> s.getUser().getId().equals(user.getId()))
                .map(SubmissionResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SubmissionResponse getById(UUID id, User user) {
        Submission sub = submissionRepo.findById(id)
                .orElseThrow(() -> new ApiException(
                        "SUBMISSION_NOT_FOUND: Submission not found", HttpStatus.NOT_FOUND));
        // Users can only see their own submissions (admins could skip this check)
        if (!sub.getUser().getId().equals(user.getId())) {
            throw new ApiException("FORBIDDEN: Access denied", HttpStatus.FORBIDDEN);
        }
        return SubmissionResponse.from(sub);
    }

    // ── Judge Engine ──────────────────────────────────────────────────────────

    /**
     * The heart of the system — runs code against every test case sequentially.
     * Express analogy: like calling a series of middleware checks, stopping on
     * first failure.
     */
    private JudgeResult judge(Problem problem, String language, String code, boolean sampleOnly) {
        List<Map<String, Object>> testCases = problem.getTestCases();
        if (sampleOnly && testCases != null) {
            testCases = testCases.stream()
                    .filter(tc -> !Boolean.TRUE.equals(tc.get("isHidden")))
                    .toList();
        }
        if (testCases == null || testCases.isEmpty()) {
            return new JudgeResult(SubmissionStatus.ACCEPTED, 0, 0, Map.of(
                    "passed", 0, "total", 0, "testResults", List.of()));
        }

        List<Map<String, Object>> resultList = new ArrayList<>();
        int passed = 0;
        long maxTime = 0;
        SubmissionStatus verdict = SubmissionStatus.ACCEPTED;

        for (int i = 0; i < testCases.size(); i++) {
            Map<String, Object> tc = testCases.get(i);
            String input = (String) tc.get("input");
            String expected = ((String) tc.get("expectedOutput")).trim();

            // For compiled languages (Java, C++) the container must run javac/g++ first.
            // Add a per-language compile buffer so compilation overhead doesn't eat the
            // problem's time limit — only pure execution time is measured after judgment.
            SandboxResult result = sandbox.run(SandboxRequest.builder()
                    .language(language)
                    .code(code)
                    .stdin(input)
                    .timeoutMs(problem.getTimeLimitMs() + compileBuffer(language))
                    .memoryLimit(problem.getMemoryLimitMb() + "m")
                    .build());

            maxTime = Math.max(maxTime, result.getExecutionTimeMs());

            // Classify the result — only the `else` branch falls through to the code below;
            // all error branches return early.
            SubmissionStatus caseVerdict = SubmissionStatus.ACCEPTED;
            String got = "";

            if (result.isTimedOut()) {
                // Stop immediately — further results are meaningless
                resultList.add(Map.of("passed", false, "timeMs", result.getExecutionTimeMs()));
                return new JudgeResult(SubmissionStatus.TIME_LIMIT_EXCEEDED, passed,
                        result.getExecutionTimeMs(), Map.of(
                                "passed", passed,
                                "total", testCases.size(),
                                "testResults", resultList,
                                "failedAt", i + 1));
            } else if (result.isCompilationError()) {
                // Compilation failed — stop immediately, report error once
                return new JudgeResult(SubmissionStatus.COMPILE_ERROR, 0, 0, Map.of(
                        "passed", 0,
                        "total", testCases.size(),
                        "error", result.getStderr().trim()));
            } else if (result.getExitCode() == -2) {
                // Sandbox unavailable (-2 is our special code from SandboxService)
                return new JudgeResult(SubmissionStatus.SANDBOX_ERROR, 0, 0, Map.of(
                        "passed", passed, "total", testCases.size(),
                        "error", result.getStderr()));
            } else if (result.getExitCode() != 0) {
                // Runtime error — stop immediately
                String rteOutput = result.getStderr().trim();
                resultList.add(Map.of("passed", false, "timeMs", result.getExecutionTimeMs(),
                        "error", rteOutput));
                return new JudgeResult(SubmissionStatus.RUNTIME_ERROR, passed,
                        result.getExecutionTimeMs(), Map.of(
                                "passed", passed,
                                "total", testCases.size(),
                                "testResults", resultList,
                                "failedAt", i + 1));
            } else {
                got = result.getOutput(); // already trim()ed by SandboxResult.getOutput()
                caseVerdict = got.equals(expected)
                        ? SubmissionStatus.ACCEPTED
                        : SubmissionStatus.WRONG_ANSWER;
            }

            boolean casePassed = caseVerdict == SubmissionStatus.ACCEPTED;
            if (casePassed)
                passed++;

            // Show input/expected/got for visible test cases only
            boolean isHidden = Boolean.TRUE.equals(tc.get("isHidden"));
            Map<String, Object> tcResult = new LinkedHashMap<>();
            tcResult.put("passed", casePassed);
            tcResult.put("timeMs", result.getExecutionTimeMs());
            if (!isHidden) {
                tcResult.put("input", input);
                tcResult.put("expected", expected);
                tcResult.put("got", got);
            }
            resultList.add(tcResult);

            // Set overall verdict to the first failure encountered
            if (!casePassed && verdict == SubmissionStatus.ACCEPTED) {
                verdict = caseVerdict;
            }
        }

        Map<String, Object> resultMap = new LinkedHashMap<>();
        resultMap.put("passed", passed);
        resultMap.put("total", testCases.size());
        resultMap.put("testResults", resultList);

        return new JudgeResult(verdict, passed, maxTime, resultMap);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private String resolveStdin(String customInput, Problem problem) {
        if (customInput != null && !customInput.isBlank()) {
            return customInput;
        }
        // Fall back to first visible test case's input
        if (problem.getTestCases() != null && !problem.getTestCases().isEmpty()) {
            Object input = problem.getTestCases().get(0).get("input");
            return input instanceof String s ? s : "";
        }
        return "";
    }

    /** Internal value record for judge results */
    private record JudgeResult(
            SubmissionStatus status,
            int passed,
            long maxTimeMs,
            Map<String, Object> resultMap) {
    }

    /**
     * Extra milliseconds added to the problem's time limit to account for
     * the compile step that happens inside the sandbox container.
     * This ensures that javac / g++ startup time does NOT count against
     * the user's code execution time.
     *
     * Measured typical overhead on a mid-range machine:
     * Java (javac cold-start) : 1500 – 3000 ms
     * C++ (g++ compile) : 500 – 2000 ms
     * Python / JavaScript : 0 (interpreted — no compile step)
     */
    private long compileBuffer(String language) {
        if (language == null)
            return 0L;
        return switch (language.toLowerCase()) {
            case "java" -> 8000L; // javac JVM cold-start + docker spin-up overhead
            case "cpp" -> 5000L; // g++ compile + docker spin-up overhead
            default -> 0L; // python, javascript — interpreted
        };
    }
}
