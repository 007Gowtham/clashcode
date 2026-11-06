package com.codearena.room.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RoomSnapshotDto {
    private String type;
    private String roomCode;
    private Long version;
    private Instant sentAt;
    private RoomDto room;
    private List<TeamDto> teams;
    private List<MemberDto> members;
    private List<MemberDto> unassigned;
    private List<MemberDto> unassignedPlayers;

    public List<MemberDto> getUnassigned() {
        return unassigned != null ? unassigned : unassignedPlayers;
    }

    public List<MemberDto> getUnassignedPlayers() {
        return unassignedPlayers != null ? unassignedPlayers : unassigned;
    }
}
