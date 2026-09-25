package com.kfokam48.epreuve.backend.controller;

import com.kfokam48.epreuve.backend.dto.PresenceCreateRequest;
import com.kfokam48.epreuve.backend.dto.PresenceManuelleRequest;
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

    /**
     * Q14 — extension hors contrat imposé : le formateur ajoute une présence à
     * la main. Exposée sur un chemin distinct pour ne pas changer la
     * sémantique de POST /api/presences (qui reste réservé à l'étudiant).
     */
    @PostMapping("/api/sessions/{sessionId}/presences-manuelles")
    public ResponseEntity<PresenceResponse> ajouterPresenceManuelle(
            @PathVariable Long sessionId, @Valid @RequestBody PresenceManuelleRequest requete) {
        PresenceResponse reponse = presenceService.ajouterPresenceManuelle(sessionId, requete);
        return ResponseEntity.status(HttpStatus.CREATED).body(reponse);
    }
}
