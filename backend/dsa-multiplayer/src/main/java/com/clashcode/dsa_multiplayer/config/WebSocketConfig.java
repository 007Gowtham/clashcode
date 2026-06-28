package com.clashcode.dsa_multiplayer.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    /**
     * Register the STOMP /ws endpoint.
     * SockJS fallback lets browsers that block WebSocket use long-polling instead.
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")   // tighten in production
                .withSockJS();
    }

    /**
     * Simple in-process broker.
     *   /topic   → broadcast (1-to-many)
     *   /queue   → point-to-point (used by convertAndSendToUser)
     *   /app     → prefix for @MessageMapping methods (not used yet)
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }
}
