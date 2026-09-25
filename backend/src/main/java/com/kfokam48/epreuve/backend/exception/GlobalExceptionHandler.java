package com.kfokam48.epreuve.backend.exception;

import com.kfokam48.epreuve.backend.dto.ErreurResponse;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Gestion centralisée des erreurs (contrainte B4). Aucune exception ne doit
 * remonter au client sous forme de stack trace : tout passe par le format
 * { "code": "...", "message": "..." } imposé par le contrat.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErreurResponse> gererApiException(ApiException ex) {
        return ResponseEntity.status(ex.getStatus())
                .body(new ErreurResponse(ex.getCode(), ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErreurResponse> gererValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(err -> err.getField() + " : " + err.getDefaultMessage())
                .orElse("Requête invalide.");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErreurResponse("CHAMP_MANQUANT", message));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErreurResponse> gererContrainte(ConstraintViolationException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErreurResponse("CHAMP_MANQUANT", ex.getMessage()));
    }

    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<ErreurResponse> gererCorpsIllisible(
            org.springframework.http.converter.HttpMessageNotReadableException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErreurResponse("REQUETE_INVALIDE", "Le corps de la requête est invalide ou mal formé."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErreurResponse> gererErreurInattendue(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErreurResponse("ERREUR_INTERNE", "Une erreur inattendue est survenue."));
    }
}
