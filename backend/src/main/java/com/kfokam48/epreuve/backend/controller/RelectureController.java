package com.kfokam48.epreuve.backend.controller;

import com.kfokam48.epreuve.backend.dto.RelectureRequest;
import com.kfokam48.epreuve.backend.service.RelectureService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/relectures")
public class RelectureController {

    private final RelectureService relectureService;

    public RelectureController(RelectureService relectureService) {
        this.relectureService = relectureService;
    }

    @PostMapping("/{id}")
    public ResponseEntity<Void> rendreRelecture(@PathVariable Long id, @Valid @RequestBody RelectureRequest requete) {
        relectureService.rendreRelecture(id, requete);
        return ResponseEntity.ok().build();
    }
}
