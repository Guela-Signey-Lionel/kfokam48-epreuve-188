package com.kfokam48.epreuve.backend.dto;

import com.kfokam48.epreuve.backend.entity.StatutExercice;
import com.kfokam48.epreuve.backend.entity.StatutRelecture;

import java.time.LocalDateTime;

/**
 * Relecture assignée à un relecteur : il voit l'exercice à relire et son
 * auteur (l'inverse de RG7), ainsi que l'état de sa propre relecture.
 */
public record RelectureARendreResponse(
        Long id,
        StatutRelecture statut,
        Integer note,
        String commentaire,
        ExerciceVue exercice
) {

    public record SessionVue(Long id, String titre) {
    }

    public record ExerciceVue(Long id, String lien, StatutExercice statut,
                              SessionVue session, String auteurNom, LocalDateTime deposeAt) {
    }
}
