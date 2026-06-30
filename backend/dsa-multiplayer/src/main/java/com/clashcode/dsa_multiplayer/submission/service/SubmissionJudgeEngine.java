package com.clashcode.dsa_multiplayer.submission.service;

import com.clashcode.dsa_multiplayer.submission.entity.Problem;
import com.clashcode.dsa_multiplayer.submission.entity.SubmissionStatus;
import com.clashcode.dsa_multiplayer.submission.sandbox.SandboxRequest;
import com.clashcode.dsa_multiplayer.submission.sandbox.SandboxResult;
import com.clashcode.dsa_multiplayer.submission.sandbox.SandboxService;

import java.util.*;

/**
 * The judge engine — runs code against test cases, test case by test case.
 * Used by BOTH run() (visible cases only) and the judge worker (all cases).
 */
public final class SubmissionJudgeEngine {

    private SubmissionJudgeEngine() {}

    public record JudgeResult(
            SubmissionStatus status,
            int passed,
            long maxTimeMs,
            Map<String, Object> resultMap) {
    }

    public static JudgeResult judge(SandboxService sandbox, Problem problem,
                                     String language, String code, boolean sampleOnly) {
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

            long timeoutMs = calculateTimeoutMs(problem.getTimeLimitMs(), language);
            SandboxResult result = sandbox.run(SandboxRequest.builder()
                    .language(language)
                    .code(code)
                    .stdin(input)
                    .timeoutMs(timeoutMs)
                    .memoryLimit(problem.getMemoryLimitMb() + "m")
                    .build());

            maxTime = Math.max(maxTime, result.getExecutionTimeMs());

            SubmissionStatus caseVerdict = SubmissionStatus.ACCEPTED;
            String got = "";

            if (result.isTimedOut()) {
                resultList.add(Map.of("passed", false, "timeMs", result.getExecutionTimeMs()));
                return new JudgeResult(SubmissionStatus.TIME_LIMIT_EXCEEDED, passed,
                        result.getExecutionTimeMs(), Map.of(
                                "passed", passed,
                                "total", testCases.size(),
                                "testResults", resultList,
                                "failedAt", i + 1));
            } else if (result.isCompilationError()) {
                return new JudgeResult(SubmissionStatus.COMPILE_ERROR, 0, 0, Map.of(
                        "passed", 0,
                        "total", testCases.size(),
                        "error", result.getStderr().trim()));
            } else if (result.getExitCode() == -2) {
                return new JudgeResult(SubmissionStatus.SANDBOX_ERROR, 0, 0, Map.of(
                        "passed", passed, "total", testCases.size(),
                        "error", result.getStderr()));
            } else if (result.getExitCode() != 0) {
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
                got = result.getOutput();
                caseVerdict = got.equals(expected)
                        ? SubmissionStatus.ACCEPTED
                        : SubmissionStatus.WRONG_ANSWER;
            }

            boolean casePassed = caseVerdict == SubmissionStatus.ACCEPTED;
            if (casePassed)
                passed++;

            boolean isHidden = Boolean.TRUE.equals(tc.get("isHidden"));
            Map<String, Object> tcResult = new LinkedHashMap<>();
            tcResult.put("passed", casePassed);
            tcResult.put("timeMs", result.getExecutionTimeMs());
            tcResult.put("isHidden", isHidden);
            if (!isHidden) {
                tcResult.put("input", input);
                tcResult.put("expected", expected);
                tcResult.put("got", got);
            }
            resultList.add(tcResult);

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

    private static long calculateTimeoutMs(int baseTimeLimitMs, String language) {
        if (language == null) return baseTimeLimitMs;

        // Language-specific multiplier (slower languages get more time)
        double multiplier = switch (language.toLowerCase()) {
            case "python" -> 3.5;
            case "javascript" -> 2.5;
            case "java" -> 2.0;
            case "cpp" -> 1.5;
            default -> 1.0;
        };

        long adjustedLimit = Math.round(baseTimeLimitMs * multiplier);

        // Compile time buffer for compiled languages
        long buffer = switch (language.toLowerCase()) {
            case "java" -> 12000L; // 12s compile buffer
            case "cpp" -> 10000L;  // 10s compile buffer
            default -> 0L;
        };

        return adjustedLimit + buffer;
    }
}