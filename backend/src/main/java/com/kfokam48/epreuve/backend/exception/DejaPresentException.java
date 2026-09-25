package com.kfokam48.epreuve.backend.exception;

import org.springframework.http.HttpStatus;

public class DejaPresentException extends ApiException {
    public DejaPresentException(String message) {
        super("DEJA_PRESENT", message, HttpStatus.CONFLICT);
    }
}
