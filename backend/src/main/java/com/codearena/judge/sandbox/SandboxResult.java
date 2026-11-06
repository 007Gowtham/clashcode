package com.codearena.judge.sandbox;

import com.codearena.judge.domain.Verdict;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SandboxResult {

    private Verdict verdict;
    private long runtimeMs;
    private long memoryKb;
    private String compilerOutput;
    private Integer failedCaseIndex;

    @Builder.Default
    private List<SampleResult> sampleResults = new ArrayList<>();
}

