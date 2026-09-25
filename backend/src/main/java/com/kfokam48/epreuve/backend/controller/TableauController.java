package com.kfokam48.epreuve.backend.controller;

import com.kfokam48.epreuve.backend.dto.LigneTableau;
import com.kfokam48.epreuve.backend.service.TableauService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tableau")
public class TableauController {

    private final TableauService tableauService;

    public TableauController(TableauService tableauService) {
        this.tableauService = tableauService;
    }

    @GetMapping
    public ResponseEntity<List<LigneTableau>> voirTableau(@RequestParam Long promotionId) {
        return ResponseEntity.ok(tableauService.tableauPourPromotion(promotionId));
    }
}
