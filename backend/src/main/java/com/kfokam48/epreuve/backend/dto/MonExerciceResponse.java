package com.kfokam48.epreuve.backend.dto;

import com.kfokam48.epreuve.backend.entity.StatutExercice;
import com.kfokam48.epreuve.backend.entity.StatutRelecture;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Exercice tel que vu par son auteur (RG7) : les notes et commentaires
 * reçus sont exposés, jamais l'identité des relecteurs.
 */
public record MonExerciceResponse(
        Long id,
        String lien,
        StatutExercice statut,
        LocalDateTime deposeAt,
        SessionVue session,
        List<RelectureVue> relectures
) {

    public record SessionVue(Long id, String titre, LocalDateTime ouvertureAt) {
    }

    public record RelectureVue(StatutRelecture statut, Integer note, String commentaire) {
    }
}
