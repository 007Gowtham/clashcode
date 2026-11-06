package com.codearena.problem.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTestCaseRequest {

    @NotNull(message = "Input is required")
    private String input;

    @NotNull(message = "Expected output is required")
    private String expectedOutput;

    @NotNull(message = "isSample flag is required")
    @JsonProperty("isSample")
    private Boolean isSample;

    @Builder.Default
    private int orderIndex = 0;
}

