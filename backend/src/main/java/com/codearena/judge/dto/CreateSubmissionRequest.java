package com.codearena.judge.dto;

import com.codearena.judge.domain.SubmissionMode;
import com.codearena.problem.domain.ProgrammingLanguage;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSubmissionRequest {

    @NotNull(message = "problemId is required")
    private UUID problemId;

    private UUID roomId;

    @NotNull(message = "Programming language is required")
    private ProgrammingLanguage language;

    @NotBlank(message = "sourceCode cannot be empty")
    @Size(max = 65536, message = "sourceCode cannot exceed 64 KB")
    private String sourceCode;

    @NotNull(message = "mode (RUN | SUBMIT) is required")
    private SubmissionMode mode;
}

