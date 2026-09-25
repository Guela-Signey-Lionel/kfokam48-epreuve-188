package com.kfokam48.epreuve.backend.dto;

import com.kfokam48.epreuve.backend.entity.SourcePresence;

public record PresenceResponse(
        Long id,
        Long sessionId,
        Long etudiantId,
        SourcePresence source
) {
}
