package com.kfokam48.epreuve.backend.controller;

import com.kfokam48.epreuve.backend.dto.SessionCreateRequest;
import com.kfokam48.epreuve.backend.dto.SessionResponse;
import com.kfokam48.epreuve.backend.service.SessionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    private final SessionService sessionService;

    public SessionController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @PostMapping
    public ResponseEntity<SessionResponse> ouvrirSession(@Valid @RequestBody SessionCreateRequest requete) {
        SessionResponse reponse = sessionService.ouvrirSession(requete);
        return ResponseEntity.status(HttpStatus.CREATED).body(reponse);
    }
}
