package com.codearena.judge.sandbox;

import com.codearena.judge.domain.Submission;
import com.codearena.judge.domain.SubmissionMode;
import com.codearena.judge.domain.Verdict;
import com.codearena.problem.comparator.OutputComparator;
import com.codearena.problem.domain.TestCase;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@ConditionalOnProperty(name = "clashcode.judge.docker.enabled", havingValue = "false")
public class FakeSandboxRunner implements SandboxRunner {

    @Override
    public SandboxResult execute(Submission submission, List<TestCase> testCases, int timeLimitMs, int memoryLimitMb) {
        String code = submission.getSourceCode() != null ? submission.getSourceCode() : "";

        // Simulated verdicts based on trigger comments in test code
        if (code.contains("// VERDICT: COMPILE_ERROR")) {
            return SandboxResult.builder()
                    .verdict(Verdict.COMPILE_ERROR)
                    .compilerOutput("SyntaxError: Unexpected token ';' at line 12")
                    .runtimeMs(50)
                    .build();
        }

        if (code.contains("// VERDICT: TIME_LIMIT_EXCEEDED")) {
            return SandboxResult.builder()
                    .verdict(Verdict.TIME_LIMIT_EXCEEDED)
                    .failedCaseIndex(1)
                    .runtimeMs(timeLimitMs + 100)
                    .build();
        }

        if (code.contains("// VERDICT: MEMORY_LIMIT_EXCEEDED")) {
            return SandboxResult.builder()
                    .verdict(Verdict.MEMORY_LIMIT_EXCEEDED)
                    .failedCaseIndex(1)
                    .runtimeMs(120)
                    .memoryKb(memoryLimitMb * 1024L + 1024)
                    .build();
        }

        if (code.contains("// VERDICT: RUNTIME_ERROR")) {
            return SandboxResult.builder()
                    .verdict(Verdict.RUNTIME_ERROR)
                    .compilerOutput("NullPointerException: Cannot invoke method on null object")
                    .failedCaseIndex(1)
                    .runtimeMs(80)
                    .build();
        }

        if (code.contains("// VERDICT: WRONG_ANSWER")) {
            List<SampleResult> sampleResults = new ArrayList<>();
            if (submission.getMode() == SubmissionMode.RUN && !testCases.isEmpty()) {
                TestCase tc = testCases.get(0);
                sampleResults.add(SampleResult.builder()
                        .orderIndex(1)
                        .input(tc.getInput())
                        .expectedOutput(tc.getExpectedOutput())
                        .actualOutput("WRONG_OUTPUT_VALUE")
                        .passed(false)
                        .runtimeMs(45)
                        .build());
            }

            return SandboxResult.builder()
                    .verdict(Verdict.WRONG_ANSWER)
                    .failedCaseIndex(1)
                    .runtimeMs(45)
                    .sampleResults(sampleResults)
                    .build();
        }

        // Default: simulate successful execution matching expected outputs
        List<SampleResult> sampleResults = new ArrayList<>();
        long maxRuntime = 15;

        for (int i = 0; i < testCases.size(); i++) {
            TestCase tc = testCases.get(i);
            int caseIndex = i + 1;

            if (submission.getMode() == SubmissionMode.RUN) {
                sampleResults.add(SampleResult.builder()
                        .orderIndex(caseIndex)
                        .input(tc.getInput())
                        .expectedOutput(tc.getExpectedOutput())
                        .actualOutput(tc.getExpectedOutput())
                        .passed(true)
                        .runtimeMs(15)
                        .build());
            }
        }

        return SandboxResult.builder()
                .verdict(Verdict.ACCEPTED)
                .runtimeMs(maxRuntime)
                .memoryKb(1024)
                .sampleResults(sampleResults)
                .build();
    }
}

