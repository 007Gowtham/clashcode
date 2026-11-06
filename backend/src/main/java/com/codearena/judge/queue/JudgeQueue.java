package com.codearena.judge.queue;

import java.util.UUID;

/**
 * Pluggable queue interface for asynchronous submission judging.
 * Decouples HTTP request ingestion from code execution.
 */
public interface JudgeQueue {

    /**
     * Publishes a submission ID to the judging queue.
     *
     * @param submissionId the unique ID of the pending submission
     */
    void publish(UUID submissionId);
}

