package com.clashcode.dsa_multiplayer.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private UUID id;
    private String username;
    private String email;
    private boolean isVerified;
    private UUID activeRoomId;
    private UUID currentTeamId;
<<<<<<< HEAD
=======
    private String profilePictureKey;
>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7
}
