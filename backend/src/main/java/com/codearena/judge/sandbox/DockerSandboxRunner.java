package com.codearena.judge.sandbox;

import com.codearena.judge.domain.Submission;
import com.codearena.judge.domain.SubmissionMode;
import com.codearena.judge.domain.Verdict;
import com.codearena.problem.comparator.OutputComparator;
import com.codearena.problem.domain.ProgrammingLanguage;
import com.codearena.problem.domain.TestCase;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.concurrent.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
@Primary
@ConditionalOnProperty(name = "clashcode.judge.docker.enabled", havingValue = "true", matchIfMissing = true)
public class DockerSandboxRunner implements SandboxRunner {

    private static final int MAX_OUTPUT_BYTES = 64 * 1024; // 64 KB
    private static final int HARD_CONTAINER_TIMEOUT_SECONDS = 15;
    private static final int COMPILE_TIMEOUT_SECONDS = 10;

    private static final Pattern JAVA_PUBLIC_CLASS = Pattern.compile("public\\s+class\\s+([A-Za-z0-9_]+)");
    private static final Pattern JAVA_ANY_CLASS = Pattern.compile("class\\s+([A-Za-z0-9_]+)");

    @Value("${clashcode.judge.images.java:clashcode/java:runner}")
    private String javaImage;

    @Value("${clashcode.judge.images.python:clashcode/python:runner}")
    private String pythonImage;

    @Value("${clashcode.judge.images.cpp:clashcode/cpp:runner}")
    private String cppImage;

    @Value("${clashcode.judge.images.javascript:clashcode/javascript:runner}")
    private String jsImage;

    @Override
    public SandboxResult execute(Submission submission, List<TestCase> testCases, int timeLimitMs, int memoryLimitMb) {
        long startTime = System.currentTimeMillis();
        Path hostDir = null;
        String containerName = "judge-" + submission.getId().toString().substring(0, 12) + "-" + System.nanoTime() % 10000;

        try {
            // 1. Create unique host directory
            hostDir = Files.createTempDirectory("clashcode-judge-" + submission.getId());

            // 2. Prepare file according to language
            String preparedCode = prepareSourceCode(submission.getLanguage(), submission.getSourceCode());
            String filename = resolveFilename(submission.getLanguage(), preparedCode);
            String javaClassName = resolveJavaClassName(preparedCode);
            Path sourceFile = hostDir.resolve(filename);
            Files.writeString(sourceFile, preparedCode, StandardCharsets.UTF_8);

            String image = resolveImage(submission.getLanguage());

            // 3. Compile Step for compiled languages (Java, C++)
            if (submission.getLanguage() == ProgrammingLanguage.JAVA || submission.getLanguage() == ProgrammingLanguage.CPP) {
                CompileResult compileResult = runCompilation(image, hostDir, submission.getLanguage(), filename);
                if (!compileResult.success()) {
                    return SandboxResult.builder()
                            .verdict(Verdict.COMPILE_ERROR)
                            .compilerOutput(trimOutput(compileResult.output()))
                            .runtimeMs(System.currentTimeMillis() - startTime)
                            .build();
                }
            }

            // 4. Run Test Cases
            long maxCaseRuntime = 0;
            List<SampleResult> sampleResults = new ArrayList<>();

            for (int i = 0; i < testCases.size(); i++) {
                TestCase tc = testCases.get(i);
                int caseIndex = i + 1;

                CaseExecutionResult caseResult = runSingleTestCase(
                        image, hostDir, submission.getLanguage(), javaClassName, tc.getInput(), timeLimitMs, memoryLimitMb
                );

                maxCaseRuntime = Math.max(maxCaseRuntime, caseResult.runtimeMs());

                if (caseResult.verdict() != Verdict.ACCEPTED) {
                    if (submission.getMode() == SubmissionMode.RUN) {
                        sampleResults.add(SampleResult.builder()
                                .orderIndex(caseIndex)
                                .input(tc.getInput())
                                .expectedOutput(tc.getExpectedOutput())
                                .actualOutput(caseResult.stdout())
                                .passed(false)
                                .runtimeMs(caseResult.runtimeMs())
                                .build());
                        // In RUN mode, record failure and continue to run remaining samples
                        return SandboxResult.builder()
                                .verdict(caseResult.verdict())
                                .runtimeMs(maxCaseRuntime)
                                .failedCaseIndex(caseIndex)
                                .sampleResults(sampleResults)
                                .build();
                    }

                    // In SUBMIT mode, stop at the first failure!
                    return SandboxResult.builder()
                            .verdict(caseResult.verdict())
                            .runtimeMs(maxCaseRuntime)
                            .failedCaseIndex(caseIndex)
                            .build();
                }

                // Check output correctness using OutputComparator
                boolean matches = OutputComparator.compare(caseResult.stdout(), tc.getExpectedOutput());
                if (!matches) {
                    if (submission.getMode() == SubmissionMode.RUN) {
                        sampleResults.add(SampleResult.builder()
                                .orderIndex(caseIndex)
                                .input(tc.getInput())
                                .expectedOutput(tc.getExpectedOutput())
                                .actualOutput(caseResult.stdout())
                                .passed(false)
                                .runtimeMs(caseResult.runtimeMs())
                                .build());

                        return SandboxResult.builder()
                                .verdict(Verdict.WRONG_ANSWER)
                                .runtimeMs(maxCaseRuntime)
                                .failedCaseIndex(caseIndex)
                                .sampleResults(sampleResults)
                                .build();
                    }

                    // SUBMIT mode stops at first wrong answer
                    return SandboxResult.builder()
                            .verdict(Verdict.WRONG_ANSWER)
                            .runtimeMs(maxCaseRuntime)
                            .failedCaseIndex(caseIndex)
                            .build();
                }

                // Passed test case
                if (submission.getMode() == SubmissionMode.RUN) {
                    sampleResults.add(SampleResult.builder()
                            .orderIndex(caseIndex)
                            .input(tc.getInput())
                            .expectedOutput(tc.getExpectedOutput())
                            .actualOutput(caseResult.stdout())
                            .passed(true)
                            .runtimeMs(caseResult.runtimeMs())
                            .build());
                }
            }

            return SandboxResult.builder()
                    .verdict(Verdict.ACCEPTED)
                    .runtimeMs(maxCaseRuntime)
                    .sampleResults(sampleResults)
                    .build();

        } catch (Exception e) {
            log.error("Internal sandbox error while judging submission {}", submission.getId(), e);
            return SandboxResult.builder()
                    .verdict(Verdict.INTERNAL_ERROR)
                    .compilerOutput(trimOutput(e.getMessage()))
                    .runtimeMs(System.currentTimeMillis() - startTime)
                    .build();
        } finally {
            // Clean up temporary host folder
            if (hostDir != null) {
                deleteHostDirectory(hostDir);
            }
        }
    }

    private CompileResult runCompilation(String image, Path hostDir, ProgrammingLanguage language, String filename) {
        List<String> command = new ArrayList<>(List.of(
                "docker", "run", "--rm",
                "--network", "none",
                "--cpus", "1.0",
                "--memory", "512m",
                "--pids-limit", "64",
                "--cap-drop", "ALL",
                "-v", hostDir.toAbsolutePath() + ":/workspace",
                "-w", "/workspace",
                image
        ));

        if (language == ProgrammingLanguage.JAVA) {
            command.addAll(List.of("javac", filename));
        } else if (language == ProgrammingLanguage.CPP) {
            command.addAll(List.of("g++", "-O3", filename, "-o", "solution"));
        }

        try {
            Process process = new ProcessBuilder(command)
                    .redirectErrorStream(true)
                    .start();

            boolean finished = process.waitFor(COMPILE_TIMEOUT_SECONDS, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                return new CompileResult(false, "Compilation timed out after " + COMPILE_TIMEOUT_SECONDS + "s");
            }

            String output = readStreamWithCap(process.getInputStream());
            return new CompileResult(process.exitValue() == 0, output);
        } catch (Exception e) {
            log.error("Compilation process execution failed", e);
            return new CompileResult(false, "Compilation error: " + e.getMessage());
        }
    }

    private CaseExecutionResult runSingleTestCase(String image, Path hostDir, ProgrammingLanguage language,
                                                  String javaClassName, String input, int timeLimitMs, int memoryLimitMb) {
        List<String> command = new ArrayList<>(List.of(
                "docker", "run", "--rm", "-i",
                "--network", "none",
                "--memory", memoryLimitMb + "m",
                "--cpus", "1.0",
                "--pids-limit", "64",
                "--cap-drop", "ALL",
                "-v", hostDir.toAbsolutePath() + ":/workspace:ro",
                "-w", "/workspace",
                image
        ));

        switch (language) {
            case JAVA -> command.addAll(List.of("java", "-cp", "/workspace", javaClassName));
            case PYTHON -> command.addAll(List.of("python3", "solution.py"));
            case CPP -> command.addAll(List.of("./solution"));
            case JAVASCRIPT -> command.addAll(List.of("node", "solution.js"));
        }

        long caseStart = System.currentTimeMillis();
        try {
            Process process = new ProcessBuilder(command).start();

            // Pipe input to stdin
            try (OutputStream os = process.getOutputStream()) {
                if (input != null && !input.isEmpty()) {
                    os.write(input.getBytes(StandardCharsets.UTF_8));
                }
                os.flush();
            }

            // Read output in separate thread to prevent blocking
            CompletableFuture<String> stdoutFuture = CompletableFuture.supplyAsync(() -> readStreamWithCap(process.getInputStream()));
            CompletableFuture<String> stderrFuture = CompletableFuture.supplyAsync(() -> readStreamWithCap(process.getErrorStream()));

            long timeoutWithBuffer = Math.min(timeLimitMs + 500, HARD_CONTAINER_TIMEOUT_SECONDS * 1000L);
            boolean finished = process.waitFor(timeoutWithBuffer, TimeUnit.MILLISECONDS);
            long runtime = System.currentTimeMillis() - caseStart;

            if (!finished) {
                process.destroyForcibly();
                return new CaseExecutionResult(Verdict.TIME_LIMIT_EXCEEDED, "", "Time limit exceeded", runtime);
            }

            int exitCode = process.exitValue();
            String stdout = stdoutFuture.get(1, TimeUnit.SECONDS);
            String stderr = stderrFuture.get(1, TimeUnit.SECONDS);

            if (exitCode != 0) {
                if (exitCode == 137) {
                    return new CaseExecutionResult(Verdict.MEMORY_LIMIT_EXCEEDED, stdout, "Memory limit exceeded", runtime);
                }
                return new CaseExecutionResult(Verdict.RUNTIME_ERROR, stdout, stderr, runtime);
            }

            return new CaseExecutionResult(Verdict.ACCEPTED, stdout, stderr, runtime);

        } catch (TimeoutException | InterruptedException e) {
            return new CaseExecutionResult(Verdict.TIME_LIMIT_EXCEEDED, "", "Execution timed out", System.currentTimeMillis() - caseStart);
        } catch (Exception e) {
            log.error("TestCase execution error", e);
            return new CaseExecutionResult(Verdict.INTERNAL_ERROR, "", e.getMessage(), System.currentTimeMillis() - caseStart);
        }
    }

    private String prepareSourceCode(ProgrammingLanguage language, String sourceCode) {
        if (sourceCode == null) {
            return "";
        }
        if (language == ProgrammingLanguage.JAVA && sourceCode.contains("class Main")) {
            // If class Main is present (wrapper entrypoint), ensure other classes aren't public
            // so javac doesn't complain about multiple public classes in Main.java
            return sourceCode.replaceAll("public\\s+class\\s+(?!Main\\b)", "class ");
        }
        return sourceCode;
    }

    private String resolveFilename(ProgrammingLanguage language, String sourceCode) {
        return switch (language) {
            case JAVA -> resolveJavaClassName(sourceCode) + ".java";
            case PYTHON -> "solution.py";
            case CPP -> "main.cpp";
            case JAVASCRIPT -> "solution.js";
        };
    }

    private String resolveJavaClassName(String sourceCode) {
        if (sourceCode != null) {
            if (sourceCode.contains("class Main")) {
                return "Main";
            }
            Matcher publicMatcher = JAVA_PUBLIC_CLASS.matcher(sourceCode);
            if (publicMatcher.find()) {
                return publicMatcher.group(1);
            }
            Matcher anyMatcher = JAVA_ANY_CLASS.matcher(sourceCode);
            if (anyMatcher.find()) {
                return anyMatcher.group(1);
            }
        }
        return "Main";
    }

    private String resolveImage(ProgrammingLanguage language) {
        return switch (language) {
            case JAVA -> javaImage;
            case PYTHON -> pythonImage;
            case CPP -> cppImage;
            case JAVASCRIPT -> jsImage;
        };
    }

    private String readStreamWithCap(InputStream is) {
        try (ByteArrayOutputStream buffer = new ByteArrayOutputStream()) {
            byte[] data = new byte[2048];
            int nRead;
            int total = 0;
            while ((nRead = is.read(data, 0, data.length)) != -1) {
                buffer.write(data, 0, Math.min(nRead, MAX_OUTPUT_BYTES - total));
                total += nRead;
                if (total >= MAX_OUTPUT_BYTES) {
                    break;
                }
            }
            return buffer.toString(StandardCharsets.UTF_8);
        } catch (IOException e) {
            return "";
        }
    }

    private String trimOutput(String s) {
        if (s == null) {
            return "";
        }
        String trimmed = s.trim();
        if (trimmed.length() > 4000) {
            return trimmed.substring(0, 4000) + "\n...[output truncated]";
        }
        return trimmed;
    }

    private void deleteHostDirectory(Path dir) {
        try {
            Files.walk(dir)
                    .sorted(Comparator.reverseOrder())
                    .map(Path::toFile)
                    .forEach(File::delete);
        } catch (Exception e) {
            log.warn("Failed to delete temp host directory: {}", dir, e);
        }
    }

    private record CompileResult(boolean success, String output) {}
    private record CaseExecutionResult(Verdict verdict, String stdout, String stderr, long runtimeMs) {}
}

