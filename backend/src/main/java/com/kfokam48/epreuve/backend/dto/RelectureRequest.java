package com.kfokam48.epreuve.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RelectureRequest(
        @NotNull(message = "la note est obligatoire") Integer note,
        @NotBlank(message = "le commentaire est obligatoire") String commentaire
) {
}
