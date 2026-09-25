package com.kfokam48.epreuve.backend.exception;

import org.springframework.http.HttpStatus;

/**
 * RG (Q4) : 5 échecs consécutifs -> blocage 2 minutes. Le contrat ne définit
 * pas de code HTTP dédié pour ce cas ; on le rattache donc à 400, cohérent
 * avec "code inconnu" côté client (l'étudiant doit encore réessayer plus tard).
 */
public class TropDeTentativesException extends ApiException {
    public TropDeTentativesException(String message) {
        super("TROP_DE_TENTATIVES", message, HttpStatus.BAD_REQUEST);
    }
}
