package com.clashcode.dsa_multiplayer.submission.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;

/** Same fields as create — all optional on update */
@Getter
@Setter
public class ProblemUpdateRequest {

    @Size(max = 200)
    private String title;

    private String description;

    @Pattern(regexp = "EASY|MEDIUM|HARD", message = "Difficulty must be EASY, MEDIUM, or HARD")
    private String difficulty;

    private List<String> tags;

    private Map<String, String> templateCode;

    private List<ProblemCreateRequest.TestCaseInput> testCases;

    @Min(500) @Max(10000)
    private Integer timeLimitMs;

    @Min(64) @Max(512)
    private Integer memoryLimitMb;
}
