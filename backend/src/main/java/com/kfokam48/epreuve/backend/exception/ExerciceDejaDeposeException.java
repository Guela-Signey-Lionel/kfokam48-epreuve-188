package com.kfokam48.epreuve.backend.exception;

import org.springframework.http.HttpStatus;

public class ExerciceDejaDeposeException extends ApiException {
    public ExerciceDejaDeposeException(String message) {
        super("EXERCICE_DEJA_DEPOSE", message, HttpStatus.CONFLICT);
    }
}
