package com.codearena.room.service;

import com.codearena.judge.exception.RateLimitExceededException;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Component
public class CodeAttemptRateLimiter {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long WINDOW_SECONDS = 60;

    private final ConcurrentMap<UUID, List<Instant>> failedAttempts = new ConcurrentHashMap<>();

    public void checkRateLimit(UUID userId) {
        if (userId == null) return;
        Instant now = Instant.now();
        Instant cutoff = now.minusSeconds(WINDOW_SECONDS);

        failedAttempts.computeIfPresent(userId, (k, list) -> {
            list.removeIf(t -> t.isBefore(cutoff));
            return list.isEmpty() ? null : list;
        });

        List<Instant> attempts = failedAttempts.get(userId);
        if (attempts != null && attempts.size() >= MAX_FAILED_ATTEMPTS) {
            throw new RateLimitExceededException("Too many failed code attempts. Please wait 1 minute before trying again");
        }
    }

    public void recordFailedAttempt(UUID userId) {
        if (userId == null) return;
        Instant now = Instant.now();
        Instant cutoff = now.minusSeconds(WINDOW_SECONDS);

        failedAttempts.compute(userId, (k, list) -> {
            List<Instant> current = (list != null) ? list : Collections.synchronizedList(new ArrayList<>());
            current.removeIf(t -> t.isBefore(cutoff));
            current.add(now);
            return current;
        });
    }

    public void reset(UUID userId) {
        if (userId != null) {
            failedAttempts.remove(userId);
        }
    }
}

