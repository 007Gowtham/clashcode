package com.codearena.problem.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SelectRoomProblemsRequest {

    @NotEmpty(message = "At least one problem ID must be selected for the contest")
    private List<UUID> problemIds;
}

