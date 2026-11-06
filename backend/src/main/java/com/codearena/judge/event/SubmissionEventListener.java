package com.codearena.judge.event;

import com.codearena.room.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class SubmissionEventListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final RoomRepository roomRepository;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onSubmissionEvent(SubmissionEvent event) {
        log.info("Sending submission status update over STOMP: user={}, submission={}, status={}, verdict={}",
                event.getUserId(), event.getSubmissionId(), event.getStatus(), event.getVerdict());

        // Send to private user queue: /user/queue/submissions
        messagingTemplate.convertAndSendToUser(
                event.getUserId().toString(),
                "/queue/submissions",
                event
        );
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onLeaderboardUpdate(LeaderboardUpdateEvent event) {
        if (event.getRoomId() != null) {
            String roomCode = event.getRoomCode();
            if (roomCode == null || roomCode.isBlank()) {
                roomRepository.findById(event.getRoomId()).ifPresent(r -> event.setRoomCode(r.getRoomCode()));
                roomCode = event.getRoomCode();
            }

            log.info("Broadcasting minimal leaderboard score update to roomId={}, roomCode={}: user={}, score={}",
                    event.getRoomId(), roomCode, event.getUsername(), event.getScore());

            // 1. Broadcast to UUID-based topics
            messagingTemplate.convertAndSend("/topic/room." + event.getRoomId() + ".leaderboard", event);
            messagingTemplate.convertAndSend("/topic/rooms/" + event.getRoomId() + "/scoreboard", event);

            // 2. Broadcast to roomCode-based topics
            if (roomCode != null && !roomCode.isBlank()) {
                messagingTemplate.convertAndSend("/topic/room." + roomCode + ".leaderboard", event);
                messagingTemplate.convertAndSend("/topic/rooms/" + roomCode + "/scoreboard", event);
            }
        }
    }
}

