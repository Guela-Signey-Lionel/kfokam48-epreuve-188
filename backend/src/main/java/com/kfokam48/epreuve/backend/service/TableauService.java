package com.kfokam48.epreuve.backend.service;

import com.kfokam48.epreuve.backend.dto.LigneTableau;
import com.kfokam48.epreuve.backend.entity.Etudiant;
import com.kfokam48.epreuve.backend.entity.StatutRelecture;
import com.kfokam48.epreuve.backend.exception.PromotionInconnueException;
import com.kfokam48.epreuve.backend.repository.EtudiantRepository;
import com.kfokam48.epreuve.backend.repository.ExerciceRepository;
import com.kfokam48.epreuve.backend.repository.PresenceRepository;
import com.kfokam48.epreuve.backend.repository.PromotionRepository;
import com.kfokam48.epreuve.backend.repository.RelectureRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Q16 : par étudiant, le formateur doit voir sa présence, le nombre
 * d'exercices déposés, sa moyenne des notes reçues, et les relectures qu'il
 * lui reste à faire.
 */
@Service
public class TableauService {

    private final PromotionRepository promotionRepository;
    private final EtudiantRepository etudiantRepository;
    private final PresenceRepository presenceRepository;
    private final ExerciceRepository exerciceRepository;
    private final RelectureRepository relectureRepository;

    public TableauService(PromotionRepository promotionRepository,
                           EtudiantRepository etudiantRepository,
                           PresenceRepository presenceRepository,
                           ExerciceRepository exerciceRepository,
                           RelectureRepository relectureRepository) {
        this.promotionRepository = promotionRepository;
        this.etudiantRepository = etudiantRepository;
        this.presenceRepository = presenceRepository;
        this.exerciceRepository = exerciceRepository;
        this.relectureRepository = relectureRepository;
    }

    @Transactional(readOnly = true)
    public List<LigneTableau> tableauPourPromotion(Long promotionId) {
        if (!promotionRepository.existsById(promotionId)) {
            throw new PromotionInconnueException("Aucune promotion avec cet identifiant.");
        }

        List<Etudiant> etudiants = etudiantRepository.findByPromotionId(promotionId);

        return etudiants.stream()
                .map(e -> construireLigne(e, promotionId))
                .toList();
    }

    private LigneTableau construireLigne(Etudiant etudiant, Long promotionId) {
        long presences = presenceRepository.countByEtudiantIdAndSessionPromotionId(etudiant.getId(), promotionId);
        long exercicesDeposes = exerciceRepository.countByEtudiantIdAndSessionPromotionId(etudiant.getId(), promotionId);

        Double moyenne = calculerMoyenne(etudiant.getId(), promotionId);

        long relecturesEnAttente = relectureRepository.countByRelecteurIdAndStatutAndExercice_Session_PromotionId(
                etudiant.getId(), StatutRelecture.EN_ATTENTE, promotionId);

        return new LigneTableau(etudiant.getId(), etudiant.getNom(), presences, exercicesDeposes,
                moyenne, relecturesEnAttente);
    }

    // NOTE : implémentation volontairement simple pour ce squelette (findAll()
    // + filtrage en mémoire). À remplacer par une requête d'agrégation dédiée
    // (@Query avec AVG(...)) si le volume de données le justifie.
    private Double calculerMoyenne(Long etudiantId, Long promotionId) {
        List<com.kfokam48.epreuve.backend.entity.Relecture> relecturesRecues =
                relectureRepository.findAll().stream()
                        .filter(r -> r.getExercice().getEtudiant().getId().equals(etudiantId))
                        .filter(r -> r.getExercice().getSession().getPromotion().getId().equals(promotionId))
                        .filter(r -> r.getStatut() == StatutRelecture.RENDUE)
                        .toList();

        if (relecturesRecues.isEmpty()) {
            return null;
        }

        double somme = relecturesRecues.stream().mapToInt(com.kfokam48.epreuve.backend.entity.Relecture::getNote).sum();
        return somme / relecturesRecues.size();
    }
}
