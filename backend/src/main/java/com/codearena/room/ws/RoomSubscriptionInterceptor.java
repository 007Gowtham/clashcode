package com.codearena.room.ws;

import com.codearena.room.domain.MemberStatus;
import com.codearena.room.domain.Room;
import com.codearena.room.repository.RoomMemberRepository;
import com.codearena.room.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

@Slf4j
@Component
@RequiredArgsConstructor
public class RoomSubscriptionInterceptor implements ChannelInterceptor {

    private final RoomMemberRepository roomMemberRepository;
    private final RoomRepository roomRepository;
    private final PresenceService presenceService;

    // 6-char uppercase alphanumeric room code, excluding confusing chars 0/O/1/I
    private static final Pattern ROOM_CODE_PATTERN = Pattern.compile("^[A-Z2-9]{6}$");

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();
        if (StompCommand.CONNECT.equals(command)) {
            handleConnect(accessor);
        } else if (StompCommand.SUBSCRIBE.equals(command)) {
            handleSubscribe(accessor);
        } else if (StompCommand.DISCONNECT.equals(command)) {
            handleDisconnect(accessor);
        }

        return message;
    }

    private void handleConnect(StompHeaderAccessor accessor) {
        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
        if (sessionAttributes != null) {
            UUID userId = (UUID) sessionAttributes.get("userId");
            String username = (String) sessionAttributes.get("username");

            if (userId != null) {
                StompPrincipal principal = new StompPrincipal(userId.toString(), username);
                accessor.setUser(principal);
                presenceService.registerSession(userId, accessor.getSessionId());
                log.info("STOMP client connected: user={} sessionId={}", username, accessor.getSessionId());
            }
        }
    }

    /**
     * Resolve the first path segment after the prefix to a room UUID.
     * Accepts both full UUIDs and 6-char room codes (e.g. "QQHPVH").
     */
    private Optional<UUID> resolveRoomId(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            return Optional.empty();
        }
        // Try UUID first
        try {
            return Optional.of(UUID.fromString(identifier));
        } catch (IllegalArgumentException ignored) {
            // fall through
        }
        // Try room code
        if (ROOM_CODE_PATTERN.matcher(identifier).matches()) {
            return roomRepository.findByRoomCode(identifier).map(Room::getId);
        }
        return Optional.empty();
    }

    private void handleSubscribe(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (destination == null) {
            return;
        }

        // Match patterns:
        //   /topic/room.{id}
        //   /topic/room.{id}.anything
        //   /topic/rooms/{id}
        //   /topic/rooms/{id}/anything
        String identifier = null;

        if (destination.startsWith("/topic/room.")) {
            // /topic/room.{id} or /topic/room.{id}.suffix
            String sub = destination.substring("/topic/room.".length());
            identifier = sub.contains(".") ? sub.substring(0, sub.indexOf(".")) : sub;
        } else if (destination.startsWith("/topic/rooms/")) {
            // /topic/rooms/{id} or /topic/rooms/{id}/suffix
            String sub = destination.substring("/topic/rooms/".length());
            identifier = sub.contains("/") ? sub.substring(0, sub.indexOf("/")) : sub;
        }

        if (identifier == null) {
            // Not a room topic — allow through
            return;
        }

        if (accessor.getUser() == null) {
            log.warn("Subscription rejected: Unauthenticated client attempted to subscribe to {}", destination);
            throw new AccessDeniedException("Unauthenticated subscription attempt");
        }

        UUID userId;
        try {
            userId = UUID.fromString(accessor.getUser().getName());
        } catch (IllegalArgumentException e) {
            log.warn("Subscription rejected: invalid principal format for destination {}", destination);
            throw new AccessDeniedException("Invalid user principal");
        }

        Optional<UUID> roomIdOpt = resolveRoomId(identifier);
        if (roomIdOpt.isEmpty()) {
            log.warn("Subscription rejected: could not resolve room identifier '{}' in destination {}", identifier, destination);
            throw new AccessDeniedException("Unknown room: " + identifier);
        }

        UUID roomId = roomIdOpt.get();
        boolean isActiveMember = roomMemberRepository
                .existsByRoomIdAndUserIdAndStatus(roomId, userId, MemberStatus.ACTIVE);

        if (!isActiveMember) {
            // Also allow DISQUALIFIED members to stay subscribed briefly (they receive their own kick message)
            boolean isMemberAtAll = roomMemberRepository.findByRoomIdAndUserId(roomId, userId).isPresent();
            if (!isMemberAtAll) {
                log.warn("Subscription rejected: User {} is not a member of room {}", userId, roomId);
                throw new AccessDeniedException("User is not a member of room " + roomId);
            }
            log.info("User {} (non-ACTIVE member) subscribed to {} — allowed for notification delivery", userId, destination);
        } else {
            log.info("User {} authorized and subscribed to {}", userId, destination);
        }
    }

    private void handleDisconnect(StompHeaderAccessor accessor) {
        String sessionId = accessor.getSessionId();
        if (sessionId != null) {
            presenceService.removeSession(sessionId);
            log.info("STOMP client disconnected: sessionId={}", sessionId);
        }
    }
}

