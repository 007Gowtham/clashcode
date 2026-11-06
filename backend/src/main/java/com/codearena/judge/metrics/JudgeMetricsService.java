package com.codearena.judge.metrics;

import com.codearena.judge.domain.Verdict;
import com.codearena.problem.domain.ProgrammingLanguage;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class JudgeMetricsService {

    private final MeterRegistry meterRegistry;
    private final AtomicInteger activeWorkers = new AtomicInteger(0);
    private final Timer judgeDurationTimer;
    private final Timer queueWaitTimer;

    public JudgeMetricsService(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;

        this.judgeDurationTimer = Timer.builder("judge_duration")
                .description("Time taken to execute code inside the sandbox")
                .register(meterRegistry);

        this.queueWaitTimer = Timer.builder("queue_wait_time")
                .description("Time submission waited in queue before execution started")
                .register(meterRegistry);

        meterRegistry.gauge("active_workers", activeWorkers, AtomicInteger::get);
    }

    public void recordSubmission(Verdict verdict, ProgrammingLanguage language, String mode) {
        Counter.builder("submissions_total")
                .tag("verdict", verdict != null ? verdict.name() : "UNKNOWN")
                .tag("language", language != null ? language.name() : "UNKNOWN")
                .tag("mode", mode != null ? mode : "UNKNOWN")
                .description("Total number of submissions judged")
                .register(meterRegistry)
                .increment();
    }

    public void recordJudgeDuration(long durationMs) {
        judgeDurationTimer.record(durationMs, TimeUnit.MILLISECONDS);
    }

    public void recordQueueWaitTime(long waitTimeMs) {
        queueWaitTimer.record(waitTimeMs, TimeUnit.MILLISECONDS);
    }

    public void incrementActiveWorkers() {
        activeWorkers.incrementAndGet();
    }

    public void decrementActiveWorkers() {
        activeWorkers.decrementAndGet();
    }

    public int getActiveWorkers() {
        return activeWorkers.get();
    }
}

