package com.codearena.judge.sandbox;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SampleResult {
    private int orderIndex;
    private String input;
    private String expectedOutput;
    private String actualOutput;
    private boolean passed;
    private long runtimeMs;
}

