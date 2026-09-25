package com.kfokam48.epreuve.backend.exception;

import org.springframework.http.HttpStatus;

public class LienInvalideException extends ApiException {
    public LienInvalideException(String message) {
        super("LIEN_INVALIDE", message, HttpStatus.BAD_REQUEST);
    }
}
