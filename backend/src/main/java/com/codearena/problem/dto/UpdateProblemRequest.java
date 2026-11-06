package com.codearena.problem.dto;

import com.codearena.problem.domain.ProblemDifficulty;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProblemRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 255, message = "Title must be between 3 and 255 characters")
    private String title;

    @NotBlank(message = "Statement markdown is required")
    private String statementMarkdown;

    @NotNull(message = "Difficulty is required")
    private ProblemDifficulty difficulty;

    private Set<String> tags;

    @Min(value = 100, message = "Time limit must be at least 100 ms")
    @Max(value = 10000, message = "Time limit cannot exceed 10000 ms")
    private int timeLimitMs;

    @Min(value = 16, message = "Memory limit must be at least 16 MB")
    @Max(value = 1024, message = "Memory limit cannot exceed 1024 MB")
    private int memoryLimitMb;

    @Min(value = 10, message = "Points must be at least 10")
    @Max(value = 1000, message = "Points cannot exceed 1000")
    private int points;
}

