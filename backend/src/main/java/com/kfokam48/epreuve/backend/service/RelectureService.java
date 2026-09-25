package com.kfokam48.epreuve.backend.service;

import com.kfokam48.epreuve.backend.dto.RelectureRequest;
import com.kfokam48.epreuve.backend.entity.Exercice;
import com.kfokam48.epreuve.backend.entity.Relecture;
import com.kfokam48.epreuve.backend.entity.StatutExercice;
import com.kfokam48.epreuve.backend.entity.StatutRelecture;
import com.kfokam48.epreuve.backend.exception.NoteInvalideException;
import com.kfokam48.epreuve.backend.exception.RelectureDejaRenduException;
import com.kfokam48.epreuve.backend.exception.RelecturePropreException;
import com.kfokam48.epreuve.backend.exception.RessourceInconnueException;
import com.kfokam48.epreuve.backend.repository.ExerciceRepository;
import com.kfokam48.epreuve.backend.repository.RelectureRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * RG8 (Q9) : note entière de 0 à 20.
 * RG9 (Q10/Q15) : le sujet contient une contradiction (Q10 dit que la note est
 * modifiable tant que le formateur n'a pas clôturé la session, Q15 dit qu'elle
 * est définitive dès l'envoi). Décision retenue ici : une relecture RENDUE est
 * définitive (on suit Q15, la dernière réponse et la plus explicite : "Une
 * fois que le relecteur a validé, c'est fini"). Documente ta propre décision,
 * avec ta justification, dans le cahier des charges (section 7) — c'est noté.
 * RG2 (Q5) : un relecteur ne relit jamais son propre exercice — vérifié ici en
 * seconde ligne de défense (l'assignation aléatoire l'exclut déjà en amont).
 */
@Service
public class RelectureService {

    private final RelectureRepository relectureRepository;
    private final ExerciceRepository exerciceRepository;

    public RelectureService(RelectureRepository relectureRepository, ExerciceRepository exerciceRepository) {
        this.relectureRepository = relectureRepository;
        this.exerciceRepository = exerciceRepository;
    }

    @Transactional
    public void rendreRelecture(Long relectureId, RelectureRequest requete) {
        Relecture relecture = relectureRepository.findById(relectureId)
                .orElseThrow(() -> new RessourceInconnueException("relecture inconnue"));

        if (relecture.getStatut() == StatutRelecture.RENDUE) {
            throw new RelectureDejaRenduException("Cette relecture a déjà été rendue.");
        }

        Exercice exercice = relecture.getExercice();
        if (relecture.getRelecteur().getId().equals(exercice.getEtudiant().getId())) {
            throw new RelecturePropreException("Un étudiant ne peut pas relire son propre exercice.");
        }

        if (requete.note() == null || requete.note() < 0 || requete.note() > 20) {
            throw new NoteInvalideException("La note doit être un entier compris entre 0 et 20.");
        }

        relecture.setNote(requete.note());
        relecture.setCommentaire(requete.commentaire());
        relecture.setStatut(StatutRelecture.RENDUE);
        relecture.setMiseAJourAt(LocalDateTime.now());
        relectureRepository.save(relecture);

        exercice.setStatut(StatutExercice.RELU);
        exerciceRepository.save(exercice);
    }
}
