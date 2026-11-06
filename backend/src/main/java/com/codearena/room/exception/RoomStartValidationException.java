package com.codearena.room.exception;

import lombok.Getter;

import java.util.Collections;
import java.util.List;

@Getter
public class RoomStartValidationException extends RoomRuleViolationException {

    private final List<String> errors;

    public RoomStartValidationException(List<String> errors) {
        super(String.join("; ", errors));
        this.errors = errors != null ? errors : Collections.emptyList();
    }
}
