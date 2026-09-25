package com.kfokam48.epreuve.backend.dto;

/**
 * Ligne du tableau de bord (Q16/RG14). Changement de besoin (V3) :
 * la moyenne est accompagnée d'un drapeau "provisoire" — tant que des
 * relectures sont encore en attente pour l'étudiant, les notes reçues
 * peuvent encore s'ajouter et la moyenne peut donc encore bouger.
 */
public record LigneTableau(
        Long etudiantId,
        String nom,
        long presences,
        long exercicesDeposes,
        Double moyenne,
        boolean moyenneProvisoire,
        long relecturesEnAttente
) {
}
