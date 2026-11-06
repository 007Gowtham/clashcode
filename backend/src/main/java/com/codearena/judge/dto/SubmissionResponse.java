package com.codearena.judge.dto;

import com.codearena.judge.domain.SubmissionMode;
import com.codearena.judge.domain.SubmissionStatus;
import com.codearena.judge.domain.Verdict;
import com.codearena.judge.sandbox.SampleResult;
import com.codearena.problem.domain.ProgrammingLanguage;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Public response for code submissions.
 * Guaranteed: Never reveals hidden test case input or expected output data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SubmissionResponse {

    private UUID id;
    private UUID userId;
    private String username;
    private UUID roomId;
    private UUID problemId;
    private ProgrammingLanguage language;
    private SubmissionMode mode;
    private SubmissionStatus status;
    private Verdict verdict;
    private int score;
    private long runtimeMs;
    private long memoryKb;
    private String compilerOutput;
    private Integer failedCaseIndex;

    /**
     * Populated only in RUN mode for user's inspection of sample cases.
     */
    private List<SampleResult> sampleResults;

    private Instant createdAt;
}

