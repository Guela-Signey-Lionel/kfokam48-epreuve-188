package com.kfokam48.epreuve.backend.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Q14 : le formateur peut ajouter une présence à la main. Ce n'est pas l'une
 * des 5 opérations imposées par le contrat ; c'est une extension nécessaire,
 * exposée séparément pour ne pas modifier la sémantique de POST /api/presences.
 */
public record PresenceManuelleRequest(
        @NotNull(message = "etudiantId est obligatoire") Long etudiantId
) {
}
