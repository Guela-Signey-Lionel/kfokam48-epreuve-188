package com.kfokam48.epreuve.backend.dto;

/**
 * Format d'erreur imposé, pour toutes les erreurs sans exception :
 * { "code": "CODE_EXPIRE", "message": "Le code de présence a expiré." }
 */
public record ErreurResponse(String code, String message) {
}
