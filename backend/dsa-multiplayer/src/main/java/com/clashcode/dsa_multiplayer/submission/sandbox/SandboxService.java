package com.clashcode.dsa_multiplayer.submission.sandbox;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.concurrent.*;

/**
 * SandboxService — the ONLY class in the application that knows about Docker.
 *
 * Think of this like an Express middleware that wraps a dangerous external call.
 * The rest of the codebase calls run(SandboxRequest) and gets back a SandboxResult —
 * it never needs to know how Docker is involved.
 *
 * Execution flow:
 *   1. Base64-encode the user's code (avoids shell injection via newlines/quotes).
 *   2. Build a `docker run` command with resource limits.
 *   3. Start the process via ProcessBuilder and pipe stdin.
 *   4. Drain stdout AND stderr concurrently in background threads (prevents pipe deadlock).
 *   5. Collect stdout/stderr with a timeout watchdog.
 *   6. Return SandboxResult.
 *
 * Why concurrent draining?
 *   If you read stdout only AFTER waitFor(), the child process can block forever
 *   trying to write to a full pipe buffer (typically 64 KB). Reading both streams
 *   in parallel threads eliminates the deadlock.
 */
@Slf4j
@Service
public class SandboxService {

    @Value("${app.sandbox.image-prefix:clashcode}")
    private String imagePrefix;

    @Value("${app.sandbox.cpus:1.0}")
    private String cpuLimit;

    @Value("${app.sandbox.timeout-ms:5000}")
    private long defaultTimeoutMs;

    /** Shared thread pool for draining stdout/stderr — 2 threads per sandbox invocation. */
    private final ExecutorService drainPool = Executors.newCachedThreadPool(r -> {
        Thread t = new Thread(r, "sandbox-drain");
        t.setDaemon(true);
        return t;
    });

    /**
     * Run user code in an isolated Docker container.
     *
     * @param request language, code, stdin, timeoutMs, memoryLimit
     * @return SandboxResult with stdout, stderr, exitCode, timedOut, executionTimeMs,
     *         compilationError
     */
    public SandboxResult run(SandboxRequest request) {
        String imageTag = imagePrefix + "/" + request.getLanguage() + ":runner";
        String encodedCode = Base64.getEncoder().encodeToString(
                request.getCode().getBytes(StandardCharsets.UTF_8));

        List<String> cmd = buildCommand(imageTag, encodedCode, request);
        log.debug("Sandbox command: {}", String.join(" ", cmd));

        long start = System.currentTimeMillis();
        Process process = null;

        try {
            ProcessBuilder pb = new ProcessBuilder(cmd);
            pb.redirectErrorStream(false);   // keep stdout and stderr separate
            process = pb.start();

            // Write stdin to the container
            try (OutputStream os = process.getOutputStream()) {
                if (request.getStdin() != null && !request.getStdin().isBlank()) {
                    os.write(request.getStdin().getBytes(StandardCharsets.UTF_8));
                }
                // closing the stream signals EOF to the child process
            }

            // ── Drain stdout and stderr concurrently ──────────────────────────
            // MUST happen in background threads — if the pipe buffer fills up
            // before we call waitFor(), the child blocks writing and we deadlock.
            final Process proc = process;
            Future<String> stdoutFuture = drainPool.submit(() -> drainStream(proc.getInputStream()));
            Future<String> stderrFuture = drainPool.submit(() -> drainStream(proc.getErrorStream()));

            long timeout = request.getTimeoutMs() > 0 ? request.getTimeoutMs() : defaultTimeoutMs;
            boolean finished = process.waitFor(timeout, TimeUnit.MILLISECONDS);
            long elapsed = System.currentTimeMillis() - start;

            if (!finished) {
                process.destroyForcibly();
                stdoutFuture.cancel(true);
                stderrFuture.cancel(true);
                log.warn("Sandbox timeout after {}ms for language={}", elapsed, request.getLanguage());
                return SandboxResult.builder()
                        .stdout("")
                        .stderr("Time limit exceeded")
                        .exitCode(-1)
                        .timedOut(true)
                        .compilationError(false)
                        .executionTimeMs(elapsed)
                        .build();
            }

            // Collect drained output (give futures a generous window — process is done)
            String stdout = getQuietly(stdoutFuture, "");
            String stderr  = getQuietly(stderrFuture, "");
            int exitCode   = process.exitValue();

            // Exit code 2 → compilation failure (C++/Java runners use this convention)
            boolean isCompileError = (exitCode == 2);

            log.debug("Sandbox done: exitCode={} timeMs={} compileError={}",
                    exitCode, elapsed, isCompileError);
            return SandboxResult.builder()
                    .stdout(stdout)
                    .stderr(stderr)
                    .exitCode(exitCode)
                    .timedOut(false)
                    .compilationError(isCompileError)
                    .executionTimeMs(elapsed)
                    .build();

        } catch (IOException e) {
            // Docker not running or image not found
            log.error("Sandbox IO error (is Docker running?): {}", e.getMessage());
            return SandboxResult.builder()
                    .stdout("")
                    .stderr("Sandbox unavailable: " + e.getMessage())
                    .exitCode(-2)
                    .timedOut(false)
                    .compilationError(false)
                    .executionTimeMs(System.currentTimeMillis() - start)
                    .build();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Sandbox interrupted");
            return SandboxResult.builder()
                    .stdout("")
                    .stderr("Sandbox interrupted")
                    .exitCode(-3)
                    .timedOut(false)
                    .compilationError(false)
                    .executionTimeMs(System.currentTimeMillis() - start)
                    .build();
        } finally {
            if (process != null && process.isAlive()) {
                process.destroyForcibly();
            }
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private List<String> buildCommand(String image, String encodedCode, SandboxRequest req) {
        List<String> cmd = new ArrayList<>();
        cmd.add("docker");
        cmd.add("run");
        cmd.add("--rm");                          // auto-remove container when done
        cmd.add("--network=none");                // no internet access
        cmd.add("--memory=" + req.getMemoryLimit());
        cmd.add("--memory-swap=" + req.getMemoryLimit()); // disable swap
        cmd.add("--cpus=" + cpuLimit);
        cmd.add("--tmpfs=/tmp:rw,exec,size=64m"); // writable /tmp with exec for binaries
        cmd.add("-e"); cmd.add("CODE=" + encodedCode);
        cmd.add("-i");                            // attach stdin
        cmd.add(image);
        return cmd;
    }

    /** Drain a stream fully into a String, capped at 500 lines to prevent OOM. */
    private String drainStream(java.io.InputStream is) {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(is, StandardCharsets.UTF_8))) {
            String line;
            int lineCount = 0;
            while ((line = reader.readLine()) != null && lineCount < 500) {
                sb.append(line).append("\n");
                lineCount++;
            }
        } catch (IOException e) {
            log.debug("Stream drain interrupted: {}", e.getMessage());
        }
        return sb.toString();
    }

    /** Get future result without throwing — returns fallback on failure. */
    private String getQuietly(Future<String> future, String fallback) {
        try {
            return future.get(2, TimeUnit.SECONDS);
        } catch (Exception e) {
            return fallback;
        }
    }
}

