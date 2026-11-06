package com.codearena.problem.dto;

import com.codearena.problem.domain.ProblemDifficulty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * Contest problem DTO returned to room members during/after a contest.
 * Returns frozen contest problem details and strictly ONLY sample test cases.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContestProblemResponse {

    private UUID contestProblemId;
    private UUID roomId;
    private UUID problemId;
    private int orderIndex;
    private int points;
    private String title;
    private String slug;
    private ProblemDifficulty difficulty;
    private String statementMarkdown;
    private int timeLimitMs;
    private int memoryLimitMb;
    private List<StarterCodeDto> starterCodes;
    private List<SampleTestCaseDto> sampleTestCases;
}

