package com.codearena.room.dto;

import com.codearena.room.domain.MemberRole;
import com.codearena.room.domain.MemberStatus;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MemberDto {
    private UUID id;
    private UUID memberId;
    private UUID userId;
    private String username;
    private UUID roomId;
    private UUID teamId;
    private MemberRole role;
    private MemberStatus status;
    private Instant joinedAt;

    public UUID getMemberId() {
        return memberId != null ? memberId : id;
    }

    public UUID getId() {
        return id != null ? id : memberId;
    }
}
