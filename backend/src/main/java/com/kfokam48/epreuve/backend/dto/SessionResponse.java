package com.kfokam48.epreuve.backend.dto;

import java.time.LocalDateTime;

public record SessionResponse(
        Long id,
        String code,
        LocalDateTime ouvertureAt,
        LocalDateTime expirationAt
) {
}
