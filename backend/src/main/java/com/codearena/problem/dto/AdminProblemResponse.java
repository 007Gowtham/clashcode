package com.codearena.problem.dto;

import com.codearena.problem.domain.ProblemDifficulty;
import com.codearena.problem.domain.ProblemStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminProblemResponse {

    private UUID id;
    private String title;
    private String slug;
    private String statementMarkdown;
    private ProblemDifficulty difficulty;
    private Set<String> tags;
    private int timeLimitMs;
    private int memoryLimitMb;
    private int points;
    private UUID createdBy;
    private ProblemStatus status;
    private List<StarterCodeDto> starterCodes;
    private long sampleTestCasesCount;
    private long totalTestCasesCount;
    private Instant createdAt;
    private Instant updatedAt;
}

