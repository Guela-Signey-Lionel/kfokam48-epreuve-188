package com.kfokam48.epreuve.backend.exception;

import org.springframework.http.HttpStatus;

public class CodeInconnuException extends ApiException {
    public CodeInconnuException(String message) {
        super("CODE_INCONNU", message, HttpStatus.BAD_REQUEST);
    }
}
