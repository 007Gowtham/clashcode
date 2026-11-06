package com.codearena.judge;

import com.codearena.judge.domain.Submission;
import com.codearena.judge.domain.SubmissionMode;
import com.codearena.judge.domain.Verdict;
import com.codearena.judge.sandbox.DockerSandboxRunner;
import com.codearena.judge.sandbox.SandboxResult;
import com.codearena.problem.domain.ProgrammingLanguage;
import com.codearena.problem.domain.TestCase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class DockerSandboxRealIntegrationTest {

    @Autowired
    private DockerSandboxRunner dockerSandboxRunner;

    @Test
    @DisplayName("Real Docker Sandbox: Python string reversal produces ACCEPTED verdict")
    void testRealPythonExecutionInDocker() {
        UUID submissionId = UUID.randomUUID();
        UUID problemId = UUID.randomUUID();

        // Python code that reads stdin and prints reversed string
        String pythonCode = """
                import sys
                text = sys.stdin.read().strip()
                print(text[::-1])
                """;

        Submission submission = Submission.builder()
                .id(submissionId)
                .userId(UUID.randomUUID())
                .problemId(problemId)
                .language(ProgrammingLanguage.PYTHON)
                .sourceCode(pythonCode)
                .mode(SubmissionMode.SUBMIT)
                .build();

        List<TestCase> testCases = List.of(
                TestCase.builder()
                        .id(UUID.randomUUID())
                        .problemId(problemId)
                        .input("clashcode")
                        .expectedOutput("edochsalc")
                        .isSample(true)
                        .orderIndex(1)
                        .build()
        );

        SandboxResult result = dockerSandboxRunner.execute(submission, testCases, 3000, 128);

        assertThat(result).isNotNull();
        assertThat(result.getVerdict()).isEqualTo(Verdict.ACCEPTED);
        assertThat(result.getRuntimeMs()).isPositive();

        // Verify that temporary host folder was cleaned up in finally block
        Path tempDir = Paths.get(System.getProperty("java.io.tmpdir"));
        try (Stream<Path> stream = Files.list(tempDir)) {
            boolean folderExists = stream.anyMatch(p -> p.getFileName().toString().contains(submissionId.toString()));
            assertThat(folderExists).isFalse();
        } catch (Exception ignored) {}
    }

    @Test
    @DisplayName("Real Docker Sandbox: Infinite loop triggers TIME_LIMIT_EXCEEDED and cleans up container & folder")
    void testRealTimeoutEnforcementAndCleanup() {
        UUID submissionId = UUID.randomUUID();
        UUID problemId = UUID.randomUUID();

        // Python code that sleeps for 10 seconds (exceeding 1s time limit)
        String infiniteSleepCode = """
                import time
                time.sleep(10)
                print("finished")
                """;

        Submission submission = Submission.builder()
                .id(submissionId)
                .userId(UUID.randomUUID())
                .problemId(problemId)
                .language(ProgrammingLanguage.PYTHON)
                .sourceCode(infiniteSleepCode)
                .mode(SubmissionMode.SUBMIT)
                .build();

        List<TestCase> testCases = List.of(
                TestCase.builder()
                        .id(UUID.randomUUID())
                        .problemId(problemId)
                        .input("test")
                        .expectedOutput("finished")
                        .isSample(true)
                        .orderIndex(1)
                        .build()
        );

        // Strict 1000ms limit
        SandboxResult result = dockerSandboxRunner.execute(submission, testCases, 1000, 128);

        assertThat(result).isNotNull();
        assertThat(result.getVerdict()).isEqualTo(Verdict.TIME_LIMIT_EXCEEDED);
        assertThat(result.getFailedCaseIndex()).isEqualTo(1);

        // Verify temporary host folder was deleted despite timeout
        Path tempDir = Paths.get(System.getProperty("java.io.tmpdir"));
        try (Stream<Path> stream = Files.list(tempDir)) {
            boolean folderExists = stream.anyMatch(p -> p.getFileName().toString().contains(submissionId.toString()));
            assertThat(folderExists).isFalse();
        } catch (Exception ignored) {}
    }
}

