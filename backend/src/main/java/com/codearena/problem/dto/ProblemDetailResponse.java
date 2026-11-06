package com.codearena.problem.dto;

import com.codearena.problem.domain.ProblemDifficulty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Player-facing problem detail DTO.
 * Strictly exposes ONLY sample test cases. Hidden test cases are never present.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProblemDetailResponse {

    private UUID id;
    private String title;
    private String slug;
    private String statementMarkdown;
    private ProblemDifficulty difficulty;
    private Set<String> tags;
    private int timeLimitMs;
    private int memoryLimitMb;
    private int points;
    private List<StarterCodeDto> starterCodes;
    private List<SampleTestCaseDto> sampleTestCases;
}

