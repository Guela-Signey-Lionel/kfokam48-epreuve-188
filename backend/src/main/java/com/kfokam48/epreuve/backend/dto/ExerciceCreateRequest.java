package com.kfokam48.epreuve.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ExerciceCreateRequest(
        @NotNull(message = "sessionId est obligatoire") Long sessionId,
        @NotNull(message = "etudiantId est obligatoire") Long etudiantId,
        @NotBlank(message = "le lien est obligatoire") String lien
) {
}
