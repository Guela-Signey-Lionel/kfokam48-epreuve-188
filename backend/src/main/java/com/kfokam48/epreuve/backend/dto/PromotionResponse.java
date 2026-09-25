package com.kfokam48.epreuve.backend.dto;

/** Promotion avec son nombre d'étudiants, pour le sélecteur du frontend. */
public record PromotionResponse(Long id, String nom, long nbEtudiants) {
}
