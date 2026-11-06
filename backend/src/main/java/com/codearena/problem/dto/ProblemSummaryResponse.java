package com.codearena.problem.dto;

import com.codearena.problem.domain.ProblemDifficulty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProblemSummaryResponse {

    private UUID id;
    private String title;
    private String slug;
    private ProblemDifficulty difficulty;
    private Set<String> tags;
    private int timeLimitMs;
    private int memoryLimitMb;
    private int points;
}

