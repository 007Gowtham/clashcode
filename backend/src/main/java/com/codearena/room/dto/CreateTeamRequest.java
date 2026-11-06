package com.codearena.room.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTeamRequest {

    @NotBlank(message = "Team name is required")
    @Size(min = 2, max = 30, message = "Team name must be between 2 and 30 characters")
    @JsonAlias({"name", "team_name"})
    private String teamName;

    public String getName() {
        return teamName;
    }

    public void setName(String name) {
        this.teamName = name;
    }

    public static class CreateTeamRequestBuilder {
        public CreateTeamRequestBuilder name(String name) {
            this.teamName = name;
            return this;
        }
    }
}
