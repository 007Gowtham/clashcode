package com.codearena.room;

import com.codearena.auth.entity.User;
import com.codearena.auth.repository.UserRepository;
import com.codearena.auth.security.JwtService;
import com.codearena.room.domain.MemberRole;
import com.codearena.room.domain.MemberStatus;
import com.codearena.room.domain.Room;
import com.codearena.room.domain.RoomMember;
import com.codearena.room.domain.RoomMode;
import com.codearena.room.domain.RoomStatus;
import com.codearena.room.dto.JoinRoomRequest;
import com.codearena.room.event.RoomEvent;
import com.codearena.room.event.RoomEventType;
import com.codearena.room.repository.RoomMemberRepository;
import com.codearena.room.repository.RoomRepository;
import com.codearena.room.service.RoomService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompFrameHandler;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import java.lang.reflect.Type;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class RoomWebSocketIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private RoomService roomService;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomMemberRepository roomMemberRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        roomMemberRepository.deleteAll();
        roomRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("WebSocket: Subscribed active player receives PLAYER_JOINED event broadcast")
    void testSubscribedPlayerReceivesJoinEvent() throws Exception {
        // 1. Create Room & Admin
        UUID adminId = UUID.randomUUID();
        userRepository.save(User.builder()
                .id(adminId)
                .username("room_admin")
                .email("admin@codearena.com")
                .passwordHash("hashed")
                .createdAt(Instant.now())
                .build());

        Room room = roomRepository.save(Room.builder()
                .roomCode("WSROOM")
                .roomName("WebSocket Arena")
                .adminId(adminId)
                .mode(RoomMode.SOLO)
                .status(RoomStatus.WAITING)
                .maxPlayers(10)
                .version(1L)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build());

        // Admin is active member
        roomMemberRepository.save(RoomMember.builder()
                .roomId(room.getId())
                .userId(adminId)
                .role(MemberRole.ADMIN)
                .status(MemberStatus.ACTIVE)
                .joinedAt(Instant.now())
                .build());

        // 2. Prepare WebSocket STOMP Client authenticated as admin
        String adminToken = jwtService.generateToken(adminId, "room_admin");
        WebSocketStompClient stompClient = new WebSocketStompClient(new StandardWebSocketClient());
        MappingJackson2MessageConverter converter = new MappingJackson2MessageConverter();
        converter.setObjectMapper(objectMapper);
        stompClient.setMessageConverter(converter);

        WebSocketHttpHeaders handshakeHeaders = new WebSocketHttpHeaders();
        handshakeHeaders.add("Cookie", "access_token=" + adminToken);

        CompletableFuture<RoomEvent> receivedEventFuture = new CompletableFuture<>();

        String wsUrl = "ws://localhost:" + port + "/ws";
        StompSession session = stompClient.connectAsync(wsUrl, handshakeHeaders, new StompSessionHandlerAdapter() {
            @Override
            public void handleException(StompSession session, StompCommand command, StompHeaders headers, byte[] payload, Throwable exception) {
                receivedEventFuture.completeExceptionally(exception);
            }

            @Override
            public void handleTransportError(StompSession session, Throwable exception) {
                receivedEventFuture.completeExceptionally(exception);
            }
        }).get(10, TimeUnit.SECONDS);

        assertThat(session.isConnected()).isTrue();

        // 3. Admin subscribes to /topic/room.{roomId}
        String topic = "/topic/room." + room.getId();

        session.subscribe(topic, new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return RoomEvent.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                receivedEventFuture.complete((RoomEvent) payload);
            }
        });

        // Small wait to ensure subscription frame has been processed by the broker
        Thread.sleep(300);

        // 4. Another player joins the room via roomService (commits to DB & publishes event)
        UUID newPlayerId = UUID.randomUUID();
        userRepository.save(User.builder()
                .id(newPlayerId)
                .username("challenger_one")
                .email("challenger@codearena.com")
                .passwordHash("hashed")
                .createdAt(Instant.now())
                .build());

        roomService.joinRoom(JoinRoomRequest.builder().roomCode("WSROOM").build(), newPlayerId);

        // 5. Verify that the broadcast reached the subscribed admin client over STOMP
        RoomEvent receivedEvent = receivedEventFuture.get(10, TimeUnit.SECONDS);
        assertThat(receivedEvent).isNotNull();
        assertThat(receivedEvent.getType()).isEqualTo(RoomEventType.PLAYER_JOINED);
        assertThat(receivedEvent.getRoomId()).isEqualTo(room.getId());
        assertThat(receivedEvent.getVersion()).isGreaterThanOrEqualTo(2L);

        session.disconnect();
    }
}
