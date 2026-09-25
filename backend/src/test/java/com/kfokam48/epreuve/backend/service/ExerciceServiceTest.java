package com.kfokam48.epreuve.backend.service;

import com.kfokam48.epreuve.backend.dto.ExerciceCreateRequest;
import com.kfokam48.epreuve.backend.entity.Etudiant;
import com.kfokam48.epreuve.backend.entity.Promotion;
import com.kfokam48.epreuve.backend.entity.SessionCours;
import com.kfokam48.epreuve.backend.entity.StatutSession;
import com.kfokam48.epreuve.backend.exception.ExerciceDejaDeposeException;
import com.kfokam48.epreuve.backend.repository.EtudiantRepository;
import com.kfokam48.epreuve.backend.repository.ExerciceRepository;
import com.kfokam48.epreuve.backend.repository.PresenceRepository;
import com.kfokam48.epreuve.backend.repository.RelectureRepository;
import com.kfokam48.epreuve.backend.repository.SessionCoursRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Même course critique que pour les présences, sur POST /api/exercices :
 * deux dépôts simultanés du même étudiant pour la même session doivent
 * produire 409 EXERCICE_DEJA_DEPOSE (contrat), jamais 500.
 */
@ExtendWith(MockitoExtension.class)
class ExerciceServiceTest {

    @Mock
    private ExerciceRepository exerciceRepository;

    @Mock
    private SessionCoursRepository sessionRepository;

    @Mock
    private EtudiantRepository etudiantRepository;

    @Mock
    private PresenceRepository presenceRepository;

    @Mock
    private RelectureRepository relectureRepository;

    @InjectMocks
    private ExerciceService exerciceService;

    private Etudiant etudiant;
    private SessionCours session;

    @BeforeEach
    void setUp() {
        Promotion promotion = new Promotion(1L, "KFOKAM48");
        etudiant = new Etudiant(2L, "Brice Owona", promotion);
        session = SessionCours.builder()
                .id(10L).titre("Session").promotion(promotion).code("ABC123")
                .ouvertureAt(LocalDateTime.now().minusMinutes(1))
                .expirationAt(LocalDateTime.now().plusMinutes(14))
                .statut(StatutSession.OUVERTE)
                .build();
    }

    @Test
    void traduitLaPerteDeCourseContrainteUniqueEnExerciceDejaDepose() {
        when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));
        when(etudiantRepository.findById(2L)).thenReturn(Optional.of(etudiant));
        when(exerciceRepository.findBySessionIdAndEtudiantId(10L, 2L)).thenReturn(Optional.empty());
        when(exerciceRepository.save(any()))
                .thenThrow(new DataIntegrityViolationException("uk_exercice_session_etudiant"));

        assertThatThrownBy(() ->
                exerciceService.deposerExercice(new ExerciceCreateRequest(10L, 2L, "https://example.com/ex")))
                .isInstanceOf(ExerciceDejaDeposeException.class);
    }
}
