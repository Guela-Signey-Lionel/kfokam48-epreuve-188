package com.kfokam48.epreuve.backend.dto;

public record LigneTableau(
        Long etudiantId,
        String nom,
        long presences,
        long exercicesDeposes,
        Double moyenne,
        long relecturesEnAttente
) {
}
