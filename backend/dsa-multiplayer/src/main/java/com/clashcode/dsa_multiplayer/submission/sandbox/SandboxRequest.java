package com.clashcode.dsa_multiplayer.submission.sandbox;

import lombok.Builder;
import lombok.Getter;

/**
 * Input to SandboxService.run().
 * Think of this like the payload you'd pass to an Express route handler —
 * everything the sandbox needs to execute a piece of code.
 */
@Getter
@Builder
public class SandboxRequest {

    /** Language identifier: "python", "javascript", "java", "cpp" */
    private final String language;

    /** The full source code string submitted by the user */
    private final String code;

    /** Standard input to feed into the running program (may be empty) */
    @Builder.Default
    private final String stdin = "";

    /** Maximum wall-clock time allowed before we kill the container */
    @Builder.Default
    private final long timeoutMs = 5000L;

    /** Memory limit passed to Docker (e.g. "256m") */
    @Builder.Default
    private final String memoryLimit = "256m";
}
