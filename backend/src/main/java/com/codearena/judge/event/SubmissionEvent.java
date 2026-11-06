package com.codearena.judge.event;

import com.codearena.judge.domain.SubmissionMode;
import com.codearena.judge.domain.SubmissionStatus;
import com.codearena.judge.domain.Verdict;
import com.codearena.judge.sandbox.SampleResult;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SubmissionEvent {

    private UUID submissionId;
    private UUID userId;
    private UUID roomId;
    private UUID problemId;
    private SubmissionMode mode;
    private SubmissionStatus status;
    private Verdict verdict;
    private int score;
    private long runtimeMs;
    private long memoryKb;
    private String compilerOutput;
    private Integer failedCaseIndex;
    private List<SampleResult> sampleResults;

    @Builder.Default
    private Instant timestamp = Instant.now();
}

