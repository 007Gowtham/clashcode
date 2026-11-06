package com.codearena.problem.dto;

import com.codearena.problem.domain.ProblemDifficulty;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProblemRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 255, message = "Title must be between 3 and 255 characters")
    private String title;

    @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$", message = "Slug must be lowercase alphanumeric with hyphens")
    private String slug;

    @NotBlank(message = "Statement markdown is required")
    private String statementMarkdown;

    @NotNull(message = "Difficulty is required")
    private ProblemDifficulty difficulty;

    private Set<String> tags;

    @Min(value = 100, message = "Time limit must be at least 100 ms")
    @Max(value = 10000, message = "Time limit cannot exceed 10000 ms")
    @Builder.Default
    private int timeLimitMs = 2000;

    @Min(value = 16, message = "Memory limit must be at least 16 MB")
    @Max(value = 1024, message = "Memory limit cannot exceed 1024 MB")
    @Builder.Default
    private int memoryLimitMb = 256;

    @Min(value = 10, message = "Points must be at least 10")
    @Max(value = 1000, message = "Points cannot exceed 1000")
    @Builder.Default
    private int points = 100;

    private List<StarterCodeDto> starterCodes;
}

