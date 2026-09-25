package com.kfokam48.epreuve.backend.controller;

import com.kfokam48.epreuve.backend.dto.PresenceCreateRequest;
import com.kfokam48.epreuve.backend.dto.PresenceResponse;
import com.kfokam48.epreuve.backend.service.PresenceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class PresenceController {

    private final PresenceService presenceService;

    public PresenceController(PresenceService presenceService) {
        this.presenceService = presenceService;
    }

    @PostMapping("/api/presences")
    public ResponseEntity<PresenceResponse> marquerPresence(@Valid @RequestBody PresenceCreateRequest requete) {
        PresenceResponse reponse = presenceService.marquerPresence(requete);
        return ResponseEntity.status(HttpStatus.CREATED).body(reponse);
    }
}
