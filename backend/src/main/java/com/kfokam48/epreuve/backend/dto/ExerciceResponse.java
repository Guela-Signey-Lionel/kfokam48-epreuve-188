package com.kfokam48.epreuve.backend.dto;

import com.kfokam48.epreuve.backend.entity.StatutExercice;

public record ExerciceResponse(
        Long id,
        StatutExercice statut
) {
}
