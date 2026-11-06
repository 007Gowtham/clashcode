package com.codearena.judge.queue;

import com.codearena.judge.service.JudgeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Production AWS SQS implementation stub for scalable distributed judging.
 * In a multi-instance production cluster, workers consume from AWS SQS FIFO queue
 * to distribute sandboxed container execution across dedicated worker EC2 instances.
 */
@Slf4j
@Service
@Profile("prod")
@RequiredArgsConstructor
public class AwsSqsJudgeQueue implements JudgeQueue {

    private final JudgeService judgeService;

    @Override
    public void publish(UUID submissionId) {
        log.info("[AWS SQS Stub] Publishing submissionId {} to SQS queue 'clashcode-submissions.fifo'", submissionId);
        // In real AWS deployment:
        // sqsClient.sendMessage(SendMessageRequest.builder()
        //         .queueUrl(queueUrl)
        //         .messageBody(submissionId.toString())
        //         .messageGroupId(submissionId.toString())
        //         .messageDeduplicationId(submissionId.toString())
        //         .build());
    }

    /**
     * Stub SQS listener that processes incoming submission messages from the queue.
     */
    public void onMessage(String messageBody) {
        try {
            UUID submissionId = UUID.fromString(messageBody.trim());
            log.info("[AWS SQS Stub] Received message for submissionId {}", submissionId);
            judgeService.judge(submissionId);
        } catch (Exception e) {
            log.error("[AWS SQS Stub] Failed to process SQS judge message: {}", messageBody, e);
        }
    }
}

