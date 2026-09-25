package com.kfokam48.epreuve.backend.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception métier de base. Chaque sous-classe porte le code d'erreur métier
 * (format imposé par le contrat : { "code": "...", "message": "..." }) et le
 * statut HTTP correspondant.
 */
public class ApiException extends RuntimeException {

    private final String code;
    private final HttpStatus status;

    public ApiException(String code, String message, HttpStatus status) {
        super(message);
        this.code = code;
        this.status = status;
    }

    public String getCode() {
        return code;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
