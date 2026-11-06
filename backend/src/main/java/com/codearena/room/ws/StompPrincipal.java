package com.codearena.room.ws;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.security.Principal;

@Getter
@AllArgsConstructor
public class StompPrincipal implements Principal {

    private final String name; // user ID as string for user destination routing
    private final String username;

    @Override
    public String getName() {
        return name;
    }
}

