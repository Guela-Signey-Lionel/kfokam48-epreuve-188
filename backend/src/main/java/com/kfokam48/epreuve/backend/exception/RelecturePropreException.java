package com.kfokam48.epreuve.backend.exception;

import org.springframework.http.HttpStatus;

public class RelecturePropreException extends ApiException {
    public RelecturePropreException(String message) {
        super("RELECTURE_PROPRE_EXERCICE", message, HttpStatus.FORBIDDEN);
    }
}
