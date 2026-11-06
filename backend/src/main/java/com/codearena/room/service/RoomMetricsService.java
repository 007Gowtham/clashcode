package com.codearena.room.service;

import com.codearena.room.domain.RoomStatus;
import com.codearena.room.repository.RoomRepository;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RoomMetricsService {

    private final Counter roomsCreatedCounter;
    private final Counter teamJoinsCounter;
    private final Counter kicksCounter;
    private final RoomRepository roomRepository;

    public RoomMetricsService(MeterRegistry meterRegistry, RoomRepository roomRepository) {
        this.roomRepository = roomRepository;

        this.roomsCreatedCounter = Counter.builder("rooms_created")
                .description("Total number of rooms created")
                .register(meterRegistry);

        this.teamJoinsCounter = Counter.builder("team_joins")
                .description("Total number of successful team joins")
                .register(meterRegistry);

        this.kicksCounter = Counter.builder("kicks")
                .description("Total number of players kicked from rooms or teams")
                .register(meterRegistry);

        Gauge.builder("active_rooms", this, RoomMetricsService::getActiveRoomsCount)
                .description("Current number of active rooms (WAITING or STARTED)")
                .register(meterRegistry);
    }

    public void recordRoomCreated() {
        roomsCreatedCounter.increment();
    }

    public void recordTeamJoin() {
        teamJoinsCounter.increment();
    }

    public void recordKick() {
        kicksCounter.increment();
    }

    public double getActiveRoomsCount() {
        return roomRepository.countByStatusIn(List.of(RoomStatus.WAITING, RoomStatus.IN_PROGRESS));
    }
}

