package com.clashcode.dsa_multiplayer.submission.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class SubmitRequest {

    @NotNull(message = "Problem ID is required")
    private UUID problemId;

    /** Optional — submission linked to a room match */
    private UUID roomId;

    @NotBlank(message = "Language is required")
    @Pattern(regexp = "java|python|javascript|cpp", message = "Language must be java, python, javascript, or cpp")
    private String language;

    @NotBlank(message = "Code is required")
    private String code;
}
