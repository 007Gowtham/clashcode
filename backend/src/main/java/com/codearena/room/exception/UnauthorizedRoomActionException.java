package com.codearena.room.exception;

public class UnauthorizedRoomActionException extends RuntimeException {
    public UnauthorizedRoomActionException(String message) {
        super(message);
    }
}

