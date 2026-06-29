package com.clashcode.dsa_multiplayer.submission.dto;

import com.clashcode.dsa_multiplayer.submission.entity.Submission;
import com.clashcode.dsa_multiplayer.submission.entity.SubmissionStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Getter
@Builder
public class SubmissionResponse {

    private UUID id;
    private UUID problemId;
    private String problemTitle;
    private UUID roomId;
    private String language;
    private SubmissionStatus status;
    private int passedCount;
    private int totalCount;
    private List<TestCaseResult> testResults;
    private Integer executionTimeMs;
    private Instant submittedAt;

    @Getter
    @Builder
    public static class TestCaseResult {
        private String input;
        private String expected;
        private String got;
        private boolean passed;
        private Long timeMs;
        private boolean isHidden;
    }

    @SuppressWarnings("unchecked")
    public static SubmissionResponse from(Submission s) {
        int passed = 0, total = 0;
        List<TestCaseResult> testResults = List.of();

        if (s.getResult() != null) {
            Object p = s.getResult().get("passed");
            Object t = s.getResult().get("total");
            passed = p instanceof Number n ? n.intValue() : 0;
            total  = t instanceof Number n ? n.intValue() : 0;

            Object rawList = s.getResult().get("testResults");
            if (rawList instanceof List<?> list) {
                testResults = list.stream()
                        .filter(o -> o instanceof Map)
                        .map(o -> (Map<String, Object>) o)
                        .map(m -> TestCaseResult.builder()
                                .input((String) m.get("input"))
                                .expected((String) m.get("expected"))
                                .got((String) m.get("got"))
                                .passed(Boolean.TRUE.equals(m.get("passed")))
                                .timeMs(m.get("timeMs") instanceof Number n ? n.longValue() : null)
                                .isHidden(Boolean.TRUE.equals(m.get("isHidden")))
                                .build())
                        .toList();
            }
        }

        return SubmissionResponse.builder()
                .id(s.getId())
                .problemId(s.getProblem().getId())
                .problemTitle(s.getProblem().getTitle())
                .roomId(s.getRoom() != null ? s.getRoom().getId() : null)
                .language(s.getLanguage())
                .status(s.getStatus())
                .passedCount(passed)
                .totalCount(total)
                .testResults(testResults)
                .executionTimeMs(s.getExecutionTimeMs())
                .submittedAt(s.getSubmittedAt())
                .build();
    }
}
