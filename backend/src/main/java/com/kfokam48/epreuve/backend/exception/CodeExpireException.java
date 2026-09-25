package com.kfokam48.epreuve.backend.exception;

import org.springframework.http.HttpStatus;

public class CodeExpireException extends ApiException {
    public CodeExpireException(String message) {
        super("CODE_EXPIRE", message, HttpStatus.GONE);
    }
}
