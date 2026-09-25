package com.kfokam48.epreuve.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kfokam48.epreuve.backend.dto.SessionCreateRequest;
import com.kfokam48.epreuve.backend.entity.Etudiant;
import com.kfokam48.epreuve.backend.entity.Promotion;
import com.kfokam48.epreuve.backend.repository.EtudiantRepository;
import com.kfokam48.epreuve.backend.repository.PromotionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.http.MediaType.APPLICATION_JSON;

/**
 * Test d'intégration sur un endpoint (exigence B6), tournant sur H2 en
 * mémoire (profil "test") : aucune base locale n'est requise pour l'exécuter.
 * Vérifie le contrat de POST /api/sessions puis POST /api/presences,
 * y compris le format d'erreur imposé pour le cas "code inconnu".
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PresenceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PromotionRepository promotionRepository;

    @Autowired
    private EtudiantRepository etudiantRepository;

    private Long promotionId;
    private Long etudiantId;

    @BeforeEach
    void setUp() {
        Promotion promotion = promotionRepository.save(new Promotion(null, "Promo test"));
        Etudiant etudiant = etudiantRepository.save(new Etudiant(null, "Étudiant test", promotion));
        promotionId = promotion.getId();
        etudiantId = etudiant.getId();
    }

    @Test
    void ouvreUneSessionPuisMarqueLaPresence() throws Exception {
        SessionCreateRequest requeteSession = new SessionCreateRequest("Cours de test", promotionId);

        String reponseSession = mockMvc.perform(post("/api/sessions")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requeteSession)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").exists())
                .andReturn().getResponse().getContentAsString();

        String code = objectMapper.readTree(reponseSession).get("code").asText();

        String corpsPresence = """
                { "code": "%s", "etudiantId": %d }
                """.formatted(code, etudiantId);

        mockMvc.perform(post("/api/presences")
                        .contentType(APPLICATION_JSON)
                        .content(corpsPresence))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.source", is("ETUDIANT")));
    }

    @Test
    void refuseUnCodeInconnuAvecLeFormatDErreurImpose() throws Exception {
        String corps = """
                { "code": "INEXISTANT", "etudiantId": %d }
                """.formatted(etudiantId);

        mockMvc.perform(post("/api/presences")
                        .contentType(APPLICATION_JSON)
                        .content(corps))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("CODE_INCONNU")))
                .andExpect(jsonPath("$.message").exists());
    }
}
