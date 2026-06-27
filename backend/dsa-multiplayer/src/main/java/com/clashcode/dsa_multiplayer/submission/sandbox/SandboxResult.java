package com.clashcode.dsa_multiplayer.submission.sandbox;

import lombok.Builder;
import lombok.Getter;

/**
 * Output from SandboxService.run().
 * Maps 1-to-1 to what the docker container outputs.
 */
@Getter
@Builder
public class SandboxResult {

    /** Everything written to stdout by the program */
    private final String stdout;

    /** Everything written to stderr (compiler errors, runtime stack traces) */
    private final String stderr;

    /** OS exit code: 0 = success, 1 = runtime error, 2 = compile error, negative = sandbox internal */
    private final int exitCode;

    /** True if the container was killed because it exceeded the timeout */
    private final boolean timedOut;

    /**
     * True when the runner exited with code 2, meaning compilation failed.
     * C++ and Java runners emit exit code 2 specifically for compile errors,
     * allowing SubmissionService to report COMPILE_ERROR instead of RUNTIME_ERROR.
     */
    private final boolean compilationError;

    /** Wall-clock time the process actually ran, in milliseconds */
    private final long executionTimeMs;

    // ── Convenience helpers ──────────────────────────────────────────────────

    public boolean isSuccess() {
        return exitCode == 0 && !timedOut;
    }

    /** Trimmed stdout — use this when comparing against expected output. */
    public String getOutput() {
        return stdout == null ? "" : stdout.trim();
    }
}
