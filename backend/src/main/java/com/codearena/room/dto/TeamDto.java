package com.codearena.room.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TeamDto {
    private UUID id;
    private UUID roomId;
    private String code;
    private String teamCode;
    private String name;
    private String teamName;
    private UUID leaderId;
    private UUID leaderUserId;
    private int memberCount;
    private List<MemberDto> members;
    private Instant createdAt;

    public String getCode() {
        return code != null ? code : teamCode;
    }

    public String getTeamCode() {
        return teamCode != null ? teamCode : code;
    }

    public String getName() {
        return name != null ? name : teamName;
    }

    public String getTeamName() {
        return teamName != null ? teamName : name;
    }

    public UUID getLeaderId() {
        return leaderId != null ? leaderId : leaderUserId;
    }

    public UUID getLeaderUserId() {
        return leaderUserId != null ? leaderUserId : leaderId;
    }
}
