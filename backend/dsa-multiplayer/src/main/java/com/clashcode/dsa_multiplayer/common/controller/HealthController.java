package com.clashcode.dsa_multiplayer.common.controller;

import com.clashcode.dsa_multiplayer.common.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {

    @GetMapping({"/", "/health"})
    public ResponseEntity<ApiResponse<Map<String, String>>> getHealth() {
        return ResponseEntity.ok(
            ApiResponse.ok("Service is operational", Map.of(
                "protocol", "ClashCode-X",
                "cluster",  "Sector-01"
            ))
        );
    }
}
