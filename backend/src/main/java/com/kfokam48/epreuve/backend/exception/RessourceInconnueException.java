package com.kfokam48.epreuve.backend.exception;

import org.springframework.http.HttpStatus;

public class RessourceInconnueException extends ApiException {
    public RessourceInconnueException(String message) {
        super("RESSOURCE_INCONNUE", message, HttpStatus.NOT_FOUND);
    }
}
