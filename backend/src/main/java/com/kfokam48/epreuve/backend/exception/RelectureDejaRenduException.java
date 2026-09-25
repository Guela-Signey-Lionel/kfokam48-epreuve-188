package com.kfokam48.epreuve.backend.exception;

import org.springframework.http.HttpStatus;

public class RelectureDejaRenduException extends ApiException {
    public RelectureDejaRenduException(String message) {
        super("RELECTURE_DEJA_RENDUE", message, HttpStatus.CONFLICT);
    }
}
