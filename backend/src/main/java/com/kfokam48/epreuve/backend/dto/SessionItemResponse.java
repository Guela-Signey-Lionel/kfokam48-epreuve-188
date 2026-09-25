package com.kfokam48.epreuve.backend.dto;

import com.kfokam48.epreuve.backend.entity.StatutSession;

import java.time.LocalDateTime;

/**
 * Ligne de liste des sessions d'une promotion (opération libre, hors contrat
 * imposé) : agrège les compteurs utiles à l'affichage formateur.
 */
public record SessionItemResponse(
        Long id,
        String titre,
        String code,
        LocalDateTime ouvertureAt,
        LocalDateTime expirationAt,
        StatutSession statut,
        long nbPresences,
        long nbExercices
) {
}
