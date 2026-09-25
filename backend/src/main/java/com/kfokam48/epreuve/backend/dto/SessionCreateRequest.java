package com.kfokam48.epreuve.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SessionCreateRequest(
        @NotBlank(message = "le titre est obligatoire") String titre,
        @NotNull(message = "promotionId est obligatoire") Long promotionId
) {
}
