package com.codearena.judge.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardScoreDto {
    private UUID userId;
    private String username;
    private int score;
    private int solvedCount;
    private Instant lastAcceptedAt;
}

