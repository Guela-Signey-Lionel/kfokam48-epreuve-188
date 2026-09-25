package com.kfokam48.epreuve.backend.service;

import com.kfokam48.epreuve.backend.dto.RelectureRequest;
import com.kfokam48.epreuve.backend.entity.*;
import com.kfokam48.epreuve.backend.exception.NoteInvalideException;
import com.kfokam48.epreuve.backend.exception.RelectureDejaRenduException;
import com.kfokam48.epreuve.backend.exception.RelecturePropreException;
import com.kfokam48.epreuve.backend.repository.ExerciceRepository;
import com.kfokam48.epreuve.backend.repository.RelectureRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Test unitaire sur une règle métier réelle (exigence B6) :
 * RG2/RG5 (Q5) — un étudiant ne peut jamais relire son propre exercice,
 * et RG8 (Q9) — la note doit être un entier compris entre 0 et 20,
 * et la règle de non-double-soumission (contrat : 409 relecture déjà rendue).
 */
@ExtendWith(MockitoExtension.class)
class RelectureServiceTest {

    @Mock
    private RelectureRepository relectureRepository;

    @Mock
    private ExerciceRepository exerciceRepository;

    @InjectMocks
    private RelectureService relectureService;

    private Etudiant auteur;
    private Etudiant relecteur;
    private Exercice exercice;
    private Relecture relecture;

    @BeforeEach
    void setUp() {
        Promotion promotion = new Promotion(1L, "KFOKAM48");
        auteur = new Etudiant(1L, "Auteur", promotion);
        relecteur = new Etudiant(2L, "Relecteur", promotion);

        SessionCours session = SessionCours.builder()
                .id(1L).titre("Session 1").promotion(promotion).code("ABC123")
                .ouvertureAt(LocalDateTime.now().minusMinutes(5))
                .expirationAt(LocalDateTime.now().plusMinutes(10))
                .statut(StatutSession.OUVERTE)
                .build();

        exercice = Exercice.builder()
                .id(10L).session(session).etudiant(auteur).lien("https://example.com/ex")
                .statut(StatutExercice.EN_ATTENTE_RELECTURE).deposeAt(LocalDateTime.now())
                .build();

        relecture = Relecture.builder()
                .id(100L).exercice(exercice).relecteur(relecteur)
                .statut(StatutRelecture.EN_ATTENTE).creeAt(LocalDateTime.now())
                .build();
    }

    @Test
    void refuseQuUnEtudiantRelisePropreExercice() {
        Relecture relecturePropre = Relecture.builder()
                .id(101L).exercice(exercice).relecteur(auteur) // relecteur == auteur de l'exercice
                .statut(StatutRelecture.EN_ATTENTE).creeAt(LocalDateTime.now())
                .build();
        when(relectureRepository.findById(101L)).thenReturn(Optional.of(relecturePropre));

        assertThatThrownBy(() ->
                relectureService.rendreRelecture(101L, new RelectureRequest(15, "Bon travail")))
                .isInstanceOf(RelecturePropreException.class);
    }

    @Test
    void refuseUneNoteHorsDeLIntervalle0a20() {
        when(relectureRepository.findById(100L)).thenReturn(Optional.of(relecture));

        assertThatThrownBy(() ->
                relectureService.rendreRelecture(100L, new RelectureRequest(21, "Trop élevé")))
                .isInstanceOf(NoteInvalideException.class);
    }

    @Test
    void refuseDeRendreDeuxFoisLaMemeRelecture() {
        relecture.setStatut(StatutRelecture.RENDUE);
        when(relectureRepository.findById(100L)).thenReturn(Optional.of(relecture));

        assertThatThrownBy(() ->
                relectureService.rendreRelecture(100L, new RelectureRequest(12, "Deuxième tentative")))
                .isInstanceOf(RelectureDejaRenduException.class);
    }

    @Test
    void accepteUneRelectureValideEtClotLExercice() {
        when(relectureRepository.findById(100L)).thenReturn(Optional.of(relecture));
        when(relectureRepository.save(any())).thenReturn(relecture);
        when(exerciceRepository.save(any())).thenReturn(exercice);

        relectureService.rendreRelecture(100L, new RelectureRequest(18, "Très bon travail"));

        assertThat(relecture.getStatut()).isEqualTo(StatutRelecture.RENDUE);
        assertThat(relecture.getNote()).isEqualTo(18);
        assertThat(exercice.getStatut()).isEqualTo(StatutExercice.RELU);
    }
}
