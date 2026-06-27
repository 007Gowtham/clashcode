package com.clashcode.dsa_multiplayer.submission.dto;

import com.clashcode.dsa_multiplayer.submission.entity.Problem;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Getter
@Builder
public class ProblemResponse {

    private UUID id;
    private String title;
    private String description;
    private String difficulty;
    private List<String> tags;
    private Map<String, String> templateCode;
    /** Only non-hidden test cases are exposed in the listing */
    private List<TestCaseView> sampleTestCases;
    /** Total test case count (hidden + visible) */
    private int totalTestCases;
    private int timeLimitMs;
    private int memoryLimitMb;
    private Instant createdAt;

    @Getter
    @Builder
    public static class TestCaseView {
        private String input;
        private String expectedOutput;
    }

    public static ProblemResponse from(Problem p) {
        List<Map<String, Object>> cases = p.getTestCases() != null ? p.getTestCases() : List.of();

        List<TestCaseView> samples = cases.stream()
                .filter(tc -> !Boolean.TRUE.equals(tc.get("isHidden")))
                .map(tc -> TestCaseView.builder()
                        .input((String) tc.get("input"))
                        .expectedOutput((String) tc.get("expectedOutput"))
                        .build())
                .collect(Collectors.toList());

        List<String> tags = p.getTags() != null ? List.of(p.getTags()) : List.of();

        return ProblemResponse.builder()
                .id(p.getId())
                .title(p.getTitle())
                .description(p.getDescription())
                .difficulty(p.getDifficulty())
                .tags(tags)
                .templateCode(p.getTemplateCode())
                .sampleTestCases(samples)
                .totalTestCases(cases.size())
                .timeLimitMs(p.getTimeLimitMs())
                .memoryLimitMb(p.getMemoryLimitMb())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
