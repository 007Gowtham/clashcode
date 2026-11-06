package com.codearena.room.event;

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
public class RoomEventListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final RoomRepository roomRepository;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleRoomEvent(RoomEvent event) {
        String roomCode = event.getRoomCode();
        if ((roomCode == null || roomCode.isBlank()) && event.getRoomId() != null) {
            roomRepository.findById(event.getRoomId()).ifPresent(r -> event.setRoomCode(r.getRoomCode()));
            roomCode = event.getRoomCode();
        }

        log.info("Broadcasting after commit: type={}, roomId={}, roomCode={}, version={}",
                event.getType(), event.getRoomId(), roomCode, event.getVersion());

        // 1. Broadcast to public room topics for both UUID and roomCode
        if (event.getRoomId() != null) {
            messagingTemplate.convertAndSend("/topic/room." + event.getRoomId(), event);
            messagingTemplate.convertAndSend("/topic/rooms/" + event.getRoomId(), event);
        }

        if (roomCode != null && !roomCode.isBlank()) {
            messagingTemplate.convertAndSend("/topic/room." + roomCode, event);
            messagingTemplate.convertAndSend("/topic/rooms/" + roomCode, event);
        }

        // 2. Send targeted private notification if targetUserId is set (e.g., KICKED, DISQUALIFIED)
        if (event.getTargetUserId() != null) {
            log.info("Sending private notification to user: {} (event: {})",
                    event.getTargetUserId(), event.getType());
            messagingTemplate.convertAndSendToUser(
                    event.getTargetUserId().toString(),
                    "/queue/notifications",
                    event
            );
        }
    }
}

