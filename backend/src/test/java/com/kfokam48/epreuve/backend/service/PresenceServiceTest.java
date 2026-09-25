package com.kfokam48.epreuve.backend.service;

import com.kfokam48.epreuve.backend.config.PresenceProperties;
import com.kfokam48.epreuve.backend.dto.PresenceCreateRequest;
import com.kfokam48.epreuve.backend.entity.Etudiant;
import com.kfokam48.epreuve.backend.entity.Promotion;
import com.kfokam48.epreuve.backend.entity.SessionCours;
import com.kfokam48.epreuve.backend.entity.StatutSession;
import com.kfokam48.epreuve.backend.exception.DejaPresentException;
import com.kfokam48.epreuve.backend.repository.EtudiantRepository;
import com.kfokam48.epreuve.backend.repository.PresenceRepository;
import com.kfokam48.epreuve.backend.repository.SessionCoursRepository;
import com.kfokam48.epreuve.backend.repository.TentativePresenceEchoueeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

/**
 * Bug de course critique (issue à créer) : deux requêtes simultanées de
 * POST /api/presences pour le même couple (session, étudiant) passent toutes
 * deux le check "findBySessionIdAndEtudiantId", puis la deuxième insert échoue
 * sur la contrainte UNIQUE (session_id, etudiant_id). Sans traduction, le
 * GlobalExceptionHandler renvoie 500 ERREUR_INTERNE au lieu du 409 DEJA_PRESENT
 * exigé par le contrat. Ce test simule la perte de course au niveau du save.
 */
@ExtendWith(MockitoExtension.class)
class PresenceServiceTest {

    @Mock
    private PresenceRepository presenceRepository;

    @Mock
    private SessionCoursRepository sessionRepository;

    @Mock
    private EtudiantRepository etudiantRepository;

    @Mock
    private TentativePresenceEchoueeRepository tentativeRepository;

    @Mock
    private PresenceProperties presenceProperties;

    @InjectMocks
    private PresenceService presenceService;

    private Etudiant etudiant;
    private SessionCours session;

    @BeforeEach
    void setUp() {
        Promotion promotion = new Promotion(1L, "KFOKAM48");
        etudiant = new Etudiant(2L, "Aïcha Ngono", promotion);

        session = SessionCours.builder()
                .id(10L).titre("Session").promotion(promotion).code("ABC123")
                .ouvertureAt(LocalDateTime.now().minusMinutes(1))
                .expirationAt(LocalDateTime.now().plusMinutes(14))
                .statut(StatutSession.OUVERTE)
                .build();

        lenient().when(etudiantRepository.findById(2L)).thenReturn(Optional.of(etudiant));
        lenient().when(tentativeRepository.findByEtudiantIdAndTenteeAtAfter(any(), any()))
                .thenReturn(List.of());
        lenient().when(sessionRepository.findByCode("ABC123")).thenReturn(Optional.of(session));
        lenient().when(presenceProperties.getMaxTentativesEchouees()).thenReturn(5);
        lenient().when(presenceProperties.getDureeBlocageMinutes()).thenReturn(2);
    }

    @Test
    void traduitLaPerteDeCourseContrainteUniqueEnDejaPresent() {
        // La course est perdue : entre le check (vide) et l'insert, un autre
        // thread a inséré la même présence -> la base rejette l'insert.
        when(presenceRepository.findBySessionIdAndEtudiantId(10L, 2L)).thenReturn(Optional.empty());
        when(presenceRepository.save(any()))
                .thenThrow(new DataIntegrityViolationException("uk_presence_session_etudiant"));

        assertThatThrownBy(() ->
                presenceService.marquerPresence(new PresenceCreateRequest("ABC123", 2L)))
                .isInstanceOf(DejaPresentException.class);
    }
}
