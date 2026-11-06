package com.codearena.problem.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminTestCaseResponse {

    private UUID id;
    private UUID problemId;
    private String input;
    private String expectedOutput;

    @JsonProperty("isSample")
    private boolean isSample;

    private int orderIndex;
}

