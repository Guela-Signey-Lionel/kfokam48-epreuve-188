package com.kfokam48.epreuve.backend.controller;

import com.kfokam48.epreuve.backend.dto.ExerciceCreateRequest;
import com.kfokam48.epreuve.backend.dto.ExerciceResponse;
import com.kfokam48.epreuve.backend.service.ExerciceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/exercices")
public class ExerciceController {

    private final ExerciceService exerciceService;

    public ExerciceController(ExerciceService exerciceService) {
        this.exerciceService = exerciceService;
    }

    @PostMapping
    public ResponseEntity<ExerciceResponse> deposerExercice(@Valid @RequestBody ExerciceCreateRequest requete) {
        ExerciceResponse reponse = exerciceService.deposerExercice(requete);
        return ResponseEntity.status(HttpStatus.CREATED).body(reponse);
    }
}
