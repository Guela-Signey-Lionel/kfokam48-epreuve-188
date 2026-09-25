package com.kfokam48.epreuve.backend.service;

import com.kfokam48.epreuve.backend.dto.ExerciceCreateRequest;
import com.kfokam48.epreuve.backend.dto.ExerciceResponse;
import com.kfokam48.epreuve.backend.entity.Etudiant;
import com.kfokam48.epreuve.backend.entity.Exercice;
import com.kfokam48.epreuve.backend.entity.Presence;
import com.kfokam48.epreuve.backend.entity.Relecture;
import com.kfokam48.epreuve.backend.entity.SessionCours;
import com.kfokam48.epreuve.backend.entity.StatutExercice;
import com.kfokam48.epreuve.backend.entity.StatutRelecture;
import com.kfokam48.epreuve.backend.exception.ChampManquantException;
import com.kfokam48.epreuve.backend.exception.ExerciceDejaDeposeException;
import com.kfokam48.epreuve.backend.exception.LienInvalideException;
import com.kfokam48.epreuve.backend.repository.EtudiantRepository;
import com.kfokam48.epreuve.backend.repository.ExerciceRepository;
import com.kfokam48.epreuve.backend.repository.PresenceRepository;
import com.kfokam48.epreuve.backend.repository.RelectureRepository;
import com.kfokam48.epreuve.backend.repository.SessionCoursRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.MalformedURLException;
import java.net.URL;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * RG5 (Q5) : un étudiant ne relit jamais son propre exercice.
 * RG6 (Q6/Q7) : un seul relecteur par exercice, choisi au hasard par le
 * système parmi les étudiants présents à la session.
 * RG12 (Q13) : le lien peut être remplacé tant que personne n'a commencé
 * à le relire — implémenté ici comme : tant qu'aucun relecteur n'a encore
 * été assigné (aucune ligne "relecture" créée). C'est une zone d'ombre du
 * sujet ; documente ta propre décision dans le cahier des charges (section 7).
 * RG (Q11) : si aucun relecteur ne peut être assigné à l'instant du dépôt
 * (personne d'autre présent), l'exercice reste DEPOSE, non assigné — un
 * "trou" du besoin client à trancher toi-même.
 */
@Service
public class ExerciceService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final ExerciceRepository exerciceRepository;
    private final SessionCoursRepository sessionRepository;
    private final EtudiantRepository etudiantRepository;
    private final PresenceRepository presenceRepository;
    private final RelectureRepository relectureRepository;

    public ExerciceService(ExerciceRepository exerciceRepository,
                            SessionCoursRepository sessionRepository,
                            EtudiantRepository etudiantRepository,
                            PresenceRepository presenceRepository,
                            RelectureRepository relectureRepository) {
        this.exerciceRepository = exerciceRepository;
        this.sessionRepository = sessionRepository;
        this.etudiantRepository = etudiantRepository;
        this.presenceRepository = presenceRepository;
        this.relectureRepository = relectureRepository;
    }

    @Transactional
    public ExerciceResponse deposerExercice(ExerciceCreateRequest requete) {
        validerLien(requete.lien());

        SessionCours session = sessionRepository.findById(requete.sessionId())
                .orElseThrow(() -> new ChampManquantException("sessionId inconnu"));
        Etudiant etudiant = etudiantRepository.findById(requete.etudiantId())
                .orElseThrow(() -> new ChampManquantException("etudiantId inconnu"));

        Optional<Exercice> existant =
                exerciceRepository.findBySessionIdAndEtudiantId(session.getId(), etudiant.getId());

        Exercice exercice;
        if (existant.isPresent()) {
            exercice = existant.get();
            // RG12 : remplacement du lien autorisé tant qu'aucun relecteur n'a
            // encore été assigné (aucune ligne "relecture" créée).
            boolean relectureCommencee = !relectureRepository.findByExerciceId(exercice.getId()).isEmpty();
            if (relectureCommencee) {
                throw new ExerciceDejaDeposeException(
                        "Cet exercice a déjà été déposé et sa relecture est en cours ou terminée.");
            }
            // RG12 : remplacement du lien autorisé tant que personne n'a commencé à relire.
            exercice.setLien(requete.lien());
            exercice.setDeposeAt(LocalDateTime.now());
        } else {
            exercice = Exercice.builder()
                    .session(session)
                    .etudiant(etudiant)
                    .lien(requete.lien())
                    .statut(StatutExercice.DEPOSE)
                    .deposeAt(LocalDateTime.now())
                    .build();
            try {
                exercice = exerciceRepository.save(exercice);
            } catch (DataIntegrityViolationException e) {
                // Course critique : deux dépôts simultanés du même couple
                // (session, étudiant) passent tous deux le check ci-dessus ; la
                // contrainte UNIQUE (session_id, etudiant_id) rejette le second.
                // Le contrat impose 409 EXERCICE_DEJA_DEPOSE, pas 500.
                throw new ExerciceDejaDeposeException(
                        "Cet exercice a déjà été déposé pour cette session.");
            }
        }

        assignerRelecteursSiPossible(exercice, session, etudiant);

        return new ExerciceResponse(exercice.getId(), exercice.getStatut());
    }

    /**
     * Changement de besoin (V3) : DEUX relecteurs par exercice, tirés au sort
     * parmi les présents (hors l'auteur). S'il n'y a qu'un seul candidat, un
     * seul relecteur est assigné ; s'il n'y en a aucun, l'exercice reste
     * DEPOSE (RG15) — un re-dépôt (remplacement du lien) retente l'assignation.
     */
    private static final int NB_RELECTEURS = 2;

    private void assignerRelecteursSiPossible(Exercice exercice, SessionCours session, Etudiant depositaire) {
        List<Presence> presents = presenceRepository.findBySessionId(session.getId());
        List<Etudiant> candidats = presents.stream()
                .map(Presence::getEtudiant)
                .filter(e -> !e.getId().equals(depositaire.getId()))
                .distinct()
                .toList();

        if (candidats.isEmpty()) {
            // Trou identifié dans le besoin (voir Javadoc de la classe) : personne
            // d'éligible pour l'instant. L'exercice reste DEPOSE, non assigné.
            exercice.setStatut(StatutExercice.DEPOSE);
            exerciceRepository.save(exercice);
            return;
        }

        // Tirage sans remise de NB_RELECTEURS candidats distincts.
        List<Etudiant> pool = new java.util.ArrayList<>(candidats);
        for (int i = 0; i < NB_RELECTEURS && !pool.isEmpty(); i++) {
            Etudiant relecteur = pool.remove(RANDOM.nextInt(pool.size()));
            Relecture relecture = Relecture.builder()
                    .exercice(exercice)
                    .relecteur(relecteur)
                    .statut(StatutRelecture.EN_ATTENTE)
                    .creeAt(LocalDateTime.now())
                    .build();
            relectureRepository.save(relecture);
        }

        exercice.setStatut(StatutExercice.EN_ATTENTE_RELECTURE);
        exerciceRepository.save(exercice);
    }

    private void validerLien(String lien) {
        try {
            new URL(lien).toURI();
        } catch (MalformedURLException | java.net.URISyntaxException e) {
            throw new LienInvalideException("Le lien fourni n'est pas une URL valide.");
        }
    }
}
