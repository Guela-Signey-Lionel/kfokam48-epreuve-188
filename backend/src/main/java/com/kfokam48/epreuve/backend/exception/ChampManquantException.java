package com.kfokam48.epreuve.backend.exception;

import org.springframework.http.HttpStatus;

public class ChampManquantException extends ApiException {
    public ChampManquantException(String message) {
        super("CHAMP_MANQUANT", message, HttpStatus.BAD_REQUEST);
    }
}
