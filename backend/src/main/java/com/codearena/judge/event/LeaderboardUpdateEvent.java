package com.codearena.judge.event;

import com.codearena.judge.domain.Verdict;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Minimal leaderboard payload sent to /topic/room.{roomId}.leaderboard.
 * Strict security rule: Contains NO code, NO hidden test data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LeaderboardUpdateEvent {

    private UUID roomId;
    private String roomCode;
    private UUID userId;
    private String username;
    private UUID problemId;
    private int score;
    private Verdict verdict;

    @Builder.Default
    private Instant timestamp = Instant.now();
}

