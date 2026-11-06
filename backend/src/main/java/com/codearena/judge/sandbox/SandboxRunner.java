package com.codearena.judge.sandbox;

import com.codearena.judge.domain.Submission;
import com.codearena.problem.domain.TestCase;

import java.util.List;

public interface SandboxRunner {

    SandboxResult execute(Submission submission, List<TestCase> testCases, int timeLimitMs, int memoryLimitMb);
}

