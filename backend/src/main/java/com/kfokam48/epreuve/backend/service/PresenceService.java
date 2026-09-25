package com.kfokam48.epreuve.backend.service;

import com.kfokam48.epreuve.backend.config.PresenceProperties;
import com.kfokam48.epreuve.backend.dto.PresenceCreateRequest;
import com.kfokam48.epreuve.backend.dto.PresenceManuelleRequest;
import com.kfokam48.epreuve.backend.dto.PresenceResponse;
import com.kfokam48.epreuve.backend.entity.Etudiant;
import com.kfokam48.epreuve.backend.entity.Presence;
import com.kfokam48.epreuve.backend.entity.SessionCours;
import com.kfokam48.epreuve.backend.entity.SourcePresence;
import com.kfokam48.epreuve.backend.entity.TentativePresenceEchouee;
import com.kfokam48.epreuve.backend.exception.ChampManquantException;
import com.kfokam48.epreuve.backend.exception.CodeExpireException;
import com.kfokam48.epreuve.backend.exception.CodeInconnuException;
import com.kfokam48.epreuve.backend.exception.DejaPresentException;
import com.kfokam48.epreuve.backend.exception.RessourceInconnueException;
import com.kfokam48.epreuve.backend.exception.TropDeTentativesException;
import com.kfokam48.epreuve.backend.repository.EtudiantRepository;
import com.kfokam48.epreuve.backend.repository.PresenceRepository;
import com.kfokam48.epreuve.backend.repository.SessionCoursRepository;
import com.kfokam48.epreuve.backend.repository.TentativePresenceEchoueeRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * RG1 (Q2) : un code expire 15 minutes après l'ouverture de sa session.
 * RG (Q3) : on ne peut pas marquer sa présence une fois la session close.
 * RG (Q4) : 5 codes erronés d'affilée -> blocage 2 minutes.
 * RG13 (Q14) : le formateur peut ajouter une présence manuellement (source = FORMATEUR).
 */
@Service
public class PresenceService {

    private final PresenceRepository presenceRepository;
    private final SessionCoursRepository sessionRepository;
    private final EtudiantRepository etudiantRepository;
    private final TentativePresenceEchoueeRepository tentativeRepository;
    private final PresenceProperties presenceProperties;

    public PresenceService(PresenceRepository presenceRepository,
                            SessionCoursRepository sessionRepository,
                            EtudiantRepository etudiantRepository,
                            TentativePresenceEchoueeRepository tentativeRepository,
                            PresenceProperties presenceProperties) {
        this.presenceRepository = presenceRepository;
        this.sessionRepository = sessionRepository;
        this.etudiantRepository = etudiantRepository;
        this.tentativeRepository = tentativeRepository;
        this.presenceProperties = presenceProperties;
    }

    @Transactional
    public PresenceResponse marquerPresence(PresenceCreateRequest requete) {
        Etudiant etudiant = etudiantRepository.findById(requete.etudiantId())
                .orElseThrow(() -> new ChampManquantException("etudiantId inconnu"));

        verifierPasBloque(etudiant.getId());

        SessionCours session = sessionRepository.findByCode(requete.code()).orElse(null);
        if (session == null) {
            enregistrerEchec(etudiant);
            throw new CodeInconnuException("Ce code de présence n'existe pas.");
        }

        LocalDateTime maintenant = LocalDateTime.now();
        boolean sessionCloturee = session.getStatut() == com.kfokam48.epreuve.backend.entity.StatutSession.CLOTUREE;
        boolean codeExpire = maintenant.isAfter(session.getExpirationAt());
        if (sessionCloturee || codeExpire) {
            throw new CodeExpireException("Le code de présence a expiré.");
        }

        presenceRepository.findBySessionIdAndEtudiantId(session.getId(), etudiant.getId())
                .ifPresent(p -> {
                    throw new DejaPresentException("Cet étudiant est déjà marqué présent pour cette session.");
                });

        Presence presence = Presence.builder()
                .session(session)
                .etudiant(etudiant)
                .source(SourcePresence.ETUDIANT)
                .marqueeAt(maintenant)
                .build();
        try {
            presence = presenceRepository.save(presence);
        } catch (DataIntegrityViolationException e) {
            // Course critique : entre le check ci-dessus et l'insert, une autre
            // requête a enregistré la même présence -> la contrainte UNIQUE
            // (session_id, etudiant_id) rejette l'insert. Le contrat impose
            // 409 DEJA_PRESENT, pas 500.
            throw new DejaPresentException("Cet étudiant est déjà marqué présent pour cette session.");
        }

        return versReponse(presence);
    }

    /** Q14 : ajout manuel d'une présence par le formateur — hors des 5 opérations imposées. */
    @Transactional
    public PresenceResponse ajouterPresenceManuelle(Long sessionId, PresenceManuelleRequest requete) {
        SessionCours session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RessourceInconnueException("session inconnue"));
        Etudiant etudiant = etudiantRepository.findById(requete.etudiantId())
                .orElseThrow(() -> new ChampManquantException("etudiantId inconnu"));

        presenceRepository.findBySessionIdAndEtudiantId(session.getId(), etudiant.getId())
                .ifPresent(p -> {
                    throw new DejaPresentException("Cet étudiant est déjà marqué présent pour cette session.");
                });

        Presence presence = Presence.builder()
                .session(session)
                .etudiant(etudiant)
                .source(SourcePresence.FORMATEUR)
                .marqueeAt(LocalDateTime.now())
                .build();
        try {
            presence = presenceRepository.save(presence);
        } catch (DataIntegrityViolationException e) {
            // Même course critique que pour le marquage étudiant.
            throw new DejaPresentException("Cet étudiant est déjà marqué présent pour cette session.");
        }

        return versReponse(presence);
    }

    private void verifierPasBloque(Long etudiantId) {
        LocalDateTime fenetre = LocalDateTime.now().minusMinutes(presenceProperties.getDureeBlocageMinutes());
        List<TentativePresenceEchouee> recentes =
                tentativeRepository.findByEtudiantIdAndTenteeAtAfter(etudiantId, fenetre);
        if (recentes.size() >= presenceProperties.getMaxTentativesEchouees()) {
            throw new TropDeTentativesException(
                    "Trop de tentatives échouées. Réessaie dans quelques minutes.");
        }
    }

    private void enregistrerEchec(Etudiant etudiant) {
        tentativeRepository.save(TentativePresenceEchouee.builder()
                .etudiant(etudiant)
                .tenteeAt(LocalDateTime.now())
                .build());
    }

    private PresenceResponse versReponse(Presence presence) {
        return new PresenceResponse(
                presence.getId(),
                presence.getSession().getId(),
                presence.getEtudiant().getId(),
                presence.getSource());
    }
}
