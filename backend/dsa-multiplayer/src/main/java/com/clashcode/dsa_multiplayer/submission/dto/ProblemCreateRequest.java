package com.clashcode.dsa_multiplayer.submission.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
public class ProblemCreateRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must be at most 200 characters")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotBlank(message = "Difficulty is required")
    @Pattern(regexp = "EASY|MEDIUM|HARD", message = "Difficulty must be EASY, MEDIUM, or HARD")
    private String difficulty;

    private List<String> tags;

    /** Per-language starter code map */
    private Map<String, String> templateCode;

    @NotEmpty(message = "At least one test case is required")
    private List<TestCaseInput> testCases;

    @Min(value = 500, message = "Time limit must be at least 500ms")
    @Max(value = 10000, message = "Time limit must be at most 10000ms")
    private int timeLimitMs = 2000;

    @Min(value = 64, message = "Memory limit must be at least 64MB")
    @Max(value = 512, message = "Memory limit must be at most 512MB")
    private int memoryLimitMb = 256;

    @Getter
    @Setter
    public static class TestCaseInput {
        @NotBlank(message = "Test case input is required")
        private String input;

        @NotBlank(message = "Test case expected output is required")
        private String expectedOutput;

        @com.fasterxml.jackson.annotation.JsonProperty("isHidden")
        private boolean isHidden = false;
    }
}
