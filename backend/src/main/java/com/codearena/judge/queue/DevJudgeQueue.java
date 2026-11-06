package com.codearena.judge.queue;

import com.codearena.judge.exception.QueueFullException;
import com.codearena.judge.metrics.JudgeMetricsService;
import com.codearena.judge.service.JudgeService;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.RejectedExecutionException;

@Slf4j
@Service
@Profile("!prod")
public class DevJudgeQueue implements JudgeQueue {

    private final JudgeService judgeService;
    private final JudgeMetricsService metricsService;
    private final ThreadPoolTaskExecutor taskExecutor;

    @Value("${clashcode.judge.workers:#{T(java.lang.Math).max(1, T(java.lang.Runtime).getRuntime().availableProcessors() - 1)}}")
    private int configuredWorkers;

    @Value("${clashcode.judge.queue-capacity:100}")
    private int queueCapacity;

    public DevJudgeQueue(JudgeService judgeService, JudgeMetricsService metricsService) {
        this.judgeService = judgeService;
        this.metricsService = metricsService;
        this.taskExecutor = new ThreadPoolTaskExecutor();
    }

    @PostConstruct
    public void init() {
        int workers = Math.max(1, configuredWorkers);
        taskExecutor.setCorePoolSize(workers);
        taskExecutor.setMaxPoolSize(workers);
        taskExecutor.setQueueCapacity(queueCapacity);
        taskExecutor.setThreadNamePrefix("judge-worker-");
        taskExecutor.initialize();

        log.info("Initialized DevJudgeQueue with {} worker threads and bounded capacity {}",
                workers, queueCapacity);
    }

    @PreDestroy
    public void shutdown() {
        taskExecutor.shutdown();
    }

    @Override
    public void publish(UUID submissionId) {
        try {
            taskExecutor.execute(() -> {
                metricsService.incrementActiveWorkers();
                try {
                    log.debug("Worker picked up submission {}", submissionId);
                    judgeService.judge(submissionId);
                } catch (Exception e) {
                    log.error("Unhandled error during background judging for submission {}", submissionId, e);
                } finally {
                    metricsService.decrementActiveWorkers();
                }
            });
        } catch (RejectedExecutionException e) {
            log.warn("Judge queue is full! Rejected submission: {}", submissionId);
            throw new QueueFullException("Judge queue is currently full. Please try again shortly.");
        }
    }
}

