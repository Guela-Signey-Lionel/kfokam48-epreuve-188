package com.kfokam48.epreuve.backend.service;

import com.kfokam48.epreuve.backend.dto.EtudiantRefResponse;
import com.kfokam48.epreuve.backend.dto.MonExerciceResponse;
import com.kfokam48.epreuve.backend.dto.PromotionResponse;
import com.kfokam48.epreuve.backend.dto.RelectureARendreResponse;
import com.kfokam48.epreuve.backend.dto.SessionDetailResponse;
import com.kfokam48.epreuve.backend.dto.SessionItemResponse;
import com.kfokam48.epreuve.backend.entity.Etudiant;
import com.kfokam48.epreuve.backend.entity.Exercice;
import com.kfokam48.epreuve.backend.entity.Presence;
import com.kfokam48.epreuve.backend.entity.Promotion;
import com.kfokam48.epreuve.backend.entity.Relecture;
import com.kfokam48.epreuve.backend.entity.SessionCours;
import com.kfokam48.epreuve.backend.entity.StatutSession;
import com.kfokam48.epreuve.backend.exception.RessourceInconnueException;
import com.kfokam48.epreuve.backend.repository.EtudiantRepository;
import com.kfokam48.epreuve.backend.repository.ExerciceRepository;
import com.kfokam48.epreuve.backend.repository.PresenceRepository;
import com.kfokam48.epreuve.backend.repository.PromotionRepository;
import com.kfokam48.epreuve.backend.repository.RelectureRepository;
import com.kfokam48.epreuve.backend.repository.SessionCoursRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Opérations libres (hors contrat imposé) qui alimentent l'interface :
 * listes et détails de sessions, clôture (RG2), promotions et étudiants,
 * vues étudiant (mes exercices RG7, relectures à rendre).
 * Aucune entité JPA n'est sérialisée directement (contrainte B3).
 */
@Service
public class SessionQueryService {

    private final SessionCoursRepository sessionRepository;
    private final PromotionRepository promotionRepository;
    private final EtudiantRepository etudiantRepository;
    private final PresenceRepository presenceRepository;
    private final ExerciceRepository exerciceRepository;
    private final RelectureRepository relectureRepository;

    public SessionQueryService(SessionCoursRepository sessionRepository,
                               PromotionRepository promotionRepository,
                               EtudiantRepository etudiantRepository,
                               PresenceRepository presenceRepository,
                               ExerciceRepository exerciceRepository,
                               RelectureRepository relectureRepository) {
        this.sessionRepository = sessionRepository;
        this.promotionRepository = promotionRepository;
        this.etudiantRepository = etudiantRepository;
        this.presenceRepository = presenceRepository;
        this.exerciceRepository = exerciceRepository;
        this.relectureRepository = relectureRepository;
    }

    // ---------- Référence ----------

    @Transactional(readOnly = true)
    public List<PromotionResponse> listerPromotions() {
        return promotionRepository.findAll().stream()
                .map(p -> new PromotionResponse(p.getId(), p.getNom(),
                        etudiantRepository.findByPromotionId(p.getId()).size()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EtudiantRefResponse> listerEtudiants(Long promotionId) {
        Promotion promotion = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new RessourceInconnueException("promotion inconnue"));
        return etudiantRepository.findByPromotionId(promotion.getId()).stream()
                .map(e -> new EtudiantRefResponse(e.getId(), e.getNom()))
                .toList();
    }

    // ---------- Sessions ----------

    @Transactional(readOnly = true)
    public List<SessionItemResponse> listerSessions(Long promotionId) {
        Promotion promotion = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new RessourceInconnueException("promotion inconnue"));
        return sessionRepository.findByPromotionIdOrderByOuvertureAtDesc(promotion.getId()).stream()
                .map(this::versItem)
                .toList();
    }

    @Transactional(readOnly = true)
    public SessionDetailResponse detailSession(Long sessionId) {
        SessionCours session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RessourceInconnueException("session inconnue"));

        List<SessionDetailResponse.PresenceVue> presences =
                presenceRepository.findBySessionId(session.getId()).stream()
                        .map(p -> new SessionDetailResponse.PresenceVue(
                                p.getId(), p.getSource(), p.getMarqueeAt(),
                                new EtudiantRefResponse(p.getEtudiant().getId(), p.getEtudiant().getNom())))
                        .toList();

        List<SessionDetailResponse.ExerciceVue> exercices =
                exerciceRepository.findBySessionIdOrderByDeposeAtAsc(session.getId()).stream()
                        .map(this::versExerciceVue)
                        .toList();

        return new SessionDetailResponse(
                session.getId(), session.getTitre(), session.getCode(),
                session.getOuvertureAt(), session.getExpirationAt(), session.getStatut(),
                new SessionDetailResponse.PromotionVue(
                        session.getPromotion().getId(), session.getPromotion().getNom()),
                presences, exercices);
    }

    /** RG2 (Q3) : après clôture, plus aucune présence ne peut être enregistrée. */
    @Transactional
    public SessionDetailResponse cloturerSession(Long sessionId) {
        SessionCours session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RessourceInconnueException("session inconnue"));
        session.setStatut(StatutSession.CLOTUREE);
        session = sessionRepository.save(session);
        return detailSession(session.getId());
    }

    // ---------- Vues étudiant ----------

    /** RG7 (Q8) : l'auteur voit les notes reçues, jamais l'identité du relecteur. */
    @Transactional(readOnly = true)
    public List<MonExerciceResponse> exercicesDeLEtudiant(Long etudiantId) {
        Etudiant etudiant = etudiantRepository.findById(etudiantId)
                .orElseThrow(() -> new RessourceInconnueException("etudiant inconnu"));
        return exerciceRepository.findByEtudiantIdOrderByDeposeAtDesc(etudiant.getId()).stream()
                .map(ex -> new MonExerciceResponse(
                        ex.getId(), ex.getLien(), ex.getStatut(), ex.getDeposeAt(),
                        new MonExerciceResponse.SessionVue(
                                ex.getSession().getId(), ex.getSession().getTitre(),
                                ex.getSession().getOuvertureAt()),
                        relectureRepository.findByExerciceId(ex.getId()).stream()
                                .map(r -> new MonExerciceResponse.RelectureVue(
                                        r.getStatut(), r.getNote(), r.getCommentaire()))
                                .toList()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RelectureARendreResponse> relecturesAEtudiant(Long relecteurId) {
        Etudiant relecteur = etudiantRepository.findById(relecteurId)
                .orElseThrow(() -> new RessourceInconnueException("etudiant inconnu"));
        return relectureRepository.findByRelecteurIdOrderByCreeAtDesc(relecteur.getId()).stream()
                .map(this::versRelectureARendre)
                .toList();
    }

    // ---------- Mapping privé ----------

    private SessionItemResponse versItem(SessionCours session) {
        return new SessionItemResponse(
                session.getId(), session.getTitre(), session.getCode(),
                session.getOuvertureAt(), session.getExpirationAt(), session.getStatut(),
                presenceRepository.countBySessionId(session.getId()),
                exerciceRepository.countBySessionId(session.getId()));
    }

    private SessionDetailResponse.ExerciceVue versExerciceVue(Exercice ex) {
        List<SessionDetailResponse.RelectureVue> relectures =
                relectureRepository.findByExerciceId(ex.getId()).stream()
                        .map(r -> new SessionDetailResponse.RelectureVue(
                                r.getStatut(), r.getNote(), r.getCommentaire()))
                        .toList();
        return new SessionDetailResponse.ExerciceVue(
                ex.getId(), ex.getLien(), ex.getStatut(), ex.getDeposeAt(),
                new EtudiantRefResponse(ex.getEtudiant().getId(), ex.getEtudiant().getNom()),
                relectures);
    }

    private RelectureARendreResponse versRelectureARendre(Relecture r) {
        Exercice ex = r.getExercice();
        return new RelectureARendreResponse(
                r.getId(), r.getStatut(), r.getNote(), r.getCommentaire(),
                new RelectureARendreResponse.ExerciceVue(
                        ex.getId(), ex.getLien(), ex.getStatut(),
                        new RelectureARendreResponse.SessionVue(
                                ex.getSession().getId(), ex.getSession().getTitre()),
                        ex.getEtudiant().getNom(), ex.getDeposeAt()));
    }
}
