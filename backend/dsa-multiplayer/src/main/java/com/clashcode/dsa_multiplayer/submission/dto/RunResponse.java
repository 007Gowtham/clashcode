package com.clashcode.dsa_multiplayer.submission.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RunResponse {

    private String status;
    private java.util.List<java.util.Map<String, Object>> testResults;

    /** stdout from the program (trimmed) */
    private String output;

    /** stderr / compiler errors */
    private String error;

    /** Wall-clock time in ms */
    private long executionTimeMs;

    /** True if the program ran over the time limit */
    private boolean timedOut;

    /** True if compilation failed (Java / C++) */
    private boolean compilationError;

    /** OS exit code */
    private int exitCode;
}
