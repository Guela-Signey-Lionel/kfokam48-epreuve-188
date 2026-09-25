package com.kfokam48.epreuve.backend.exception;

import org.springframework.http.HttpStatus;

public class NoteInvalideException extends ApiException {
    public NoteInvalideException(String message) {
        super("NOTE_INVALIDE", message, HttpStatus.BAD_REQUEST);
    }
}
