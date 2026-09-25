package com.kfokam48.epreuve.backend.service;

import com.kfokam48.epreuve.backend.config.PresenceProperties;
import com.kfokam48.epreuve.backend.dto.SessionCreateRequest;
import com.kfokam48.epreuve.backend.dto.SessionResponse;
import com.kfokam48.epreuve.backend.entity.Promotion;
import com.kfokam48.epreuve.backend.entity.SessionCours;
import com.kfokam48.epreuve.backend.entity.StatutSession;
import com.kfokam48.epreuve.backend.exception.ChampManquantException;
import com.kfokam48.epreuve.backend.repository.PromotionRepository;
import com.kfokam48.epreuve.backend.repository.SessionCoursRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class SessionService {

    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans caractères ambigus
    private static final int LONGUEUR_CODE = 6;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final SessionCoursRepository sessionRepository;
    private final PromotionRepository promotionRepository;
    private final PresenceProperties presenceProperties;

    public SessionService(SessionCoursRepository sessionRepository,
                           PromotionRepository promotionRepository,
                           PresenceProperties presenceProperties) {
        this.sessionRepository = sessionRepository;
        this.promotionRepository = promotionRepository;
        this.presenceProperties = presenceProperties;
    }

    @Transactional
    public SessionResponse ouvrirSession(SessionCreateRequest requete) {
        Promotion promotion = promotionRepository.findById(requete.promotionId())
                .orElseThrow(() -> new ChampManquantException("promotionId inconnu"));

        LocalDateTime ouverture = LocalDateTime.now();
        SessionCours session = SessionCours.builder()
                .titre(requete.titre())
                .promotion(promotion)
                .code(genererCodeUnique())
                .ouvertureAt(ouverture)
                .expirationAt(ouverture.plusMinutes(presenceProperties.getDureeValiditeCodeMinutes()))
                .statut(StatutSession.OUVERTE)
                .build();

        session = sessionRepository.save(session);

        return new SessionResponse(session.getId(), session.getCode(),
                session.getOuvertureAt(), session.getExpirationAt());
    }

    private String genererCodeUnique() {
        String code;
        do {
            StringBuilder sb = new StringBuilder(LONGUEUR_CODE);
            for (int i = 0; i < LONGUEUR_CODE; i++) {
                sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
            }
            code = sb.toString();
        } while (sessionRepository.findByCode(code).isPresent());
        return code;
    }
}
