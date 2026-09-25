package com.kfokam48.epreuve.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PresenceCreateRequest(
        @NotBlank(message = "le code est obligatoire") String code,
        @NotNull(message = "etudiantId est obligatoire") Long etudiantId
) {
}
