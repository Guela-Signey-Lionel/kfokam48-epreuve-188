package com.kfokam48.epreuve.backend.dto;

import com.kfokam48.epreuve.backend.entity.SourcePresence;
import com.kfokam48.epreuve.backend.entity.StatutExercice;
import com.kfokam48.epreuve.backend.entity.StatutRelecture;
import com.kfokam48.epreuve.backend.entity.StatutSession;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Détail complet d'une session (opération libre) : code, présences avec leur
 * source (RG13), exercices déposés et, le cas échéant, la relecture associée.
 * Aucune entité JPA n'est sérialisée directement (contrainte B3).
 */
public record SessionDetailResponse(
        Long id,
        String titre,
        String code,
        LocalDateTime ouvertureAt,
        LocalDateTime expirationAt,
        StatutSession statut,
        PromotionVue promotion,
        List<PresenceVue> presences,
        List<ExerciceVue> exercices
) {

    public record PromotionVue(Long id, String nom) {
    }

    public record PresenceVue(Long id, SourcePresence source, LocalDateTime marqueeAt,
                              EtudiantRefResponse etudiant) {
    }

    public record RelectureVue(StatutRelecture statut, Integer note, String commentaire) {
    }

    // Changement de besoin (V3) : un exercice peut recevoir plusieurs
    // relectures (jusqu'à deux relecteurs) — le détail les expose toutes.
    public record ExerciceVue(Long id, String lien, StatutExercice statut, LocalDateTime deposeAt,
                              EtudiantRefResponse etudiant, List<RelectureVue> relectures) {
    }
}
