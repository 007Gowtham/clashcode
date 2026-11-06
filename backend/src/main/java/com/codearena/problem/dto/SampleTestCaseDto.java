package com.codearena.problem.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Public DTO for sample test cases.
 * Hidden test cases must NEVER be mapped or converted to this DTO.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SampleTestCaseDto {

    private UUID id;
    private String input;
    private String expectedOutput;
    private int orderIndex;
}

