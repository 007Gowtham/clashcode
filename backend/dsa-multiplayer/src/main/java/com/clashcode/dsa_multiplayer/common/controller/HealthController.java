package com.clashcode.dsa_multiplayer.common.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class HealthController {

    @GetMapping({"/", "/health"})
    public Map<String, Object> getHealth() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "operational");
        status.put("protocol", "ClashCode-X");
        status.put("cluster", "Sector-01");
        return status;
    }
}
