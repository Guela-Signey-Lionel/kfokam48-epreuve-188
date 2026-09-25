package com.kfokam48.epreuve.backend.exception;

import org.springframework.http.HttpStatus;

public class PromotionInconnueException extends ApiException {
    public PromotionInconnueException(String message) {
        super("PROMOTION_INCONNUE", message, HttpStatus.NOT_FOUND);
    }
}
