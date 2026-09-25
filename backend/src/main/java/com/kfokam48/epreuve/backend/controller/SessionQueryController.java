package com.kfokam48.epreuve.backend.controller;

import com.kfokam48.epreuve.backend.dto.EtudiantRefResponse;
import com.kfokam48.epreuve.backend.dto.MonExerciceResponse;
import com.kfokam48.epreuve.backend.dto.PromotionResponse;
import com.kfokam48.epreuve.backend.dto.RelectureARendreResponse;
import com.kfokam48.epreuve.backend.dto.SessionDetailResponse;
import com.kfokam48.epreuve.backend.dto.SessionItemResponse;
import com.kfokam48.epreuve.backend.service.SessionQueryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Opérations libres du contrat (ajoutées sous /api, hors des cinq opérations
 * imposées) : elles alimentent l'interface sans modifier le contrat de base.
 */
@RestController
@RequestMapping("/api")
public class SessionQueryController {

    private final SessionQueryService sessionQueryService;

    public SessionQueryController(SessionQueryService sessionQueryService) {
        this.sessionQueryService = sessionQueryService;
    }

    @GetMapping("/promotions")
    public List<PromotionResponse> listerPromotions() {
        return sessionQueryService.listerPromotions();
    }

    @GetMapping("/promotions/{promotionId}/etudiants")
    public List<EtudiantRefResponse> listerEtudiants(@PathVariable Long promotionId) {
        return sessionQueryService.listerEtudiants(promotionId);
    }

    @GetMapping("/sessions")
    public List<SessionItemResponse> listerSessions(@RequestParam Long promotionId) {
        return sessionQueryService.listerSessions(promotionId);
    }

    @GetMapping("/sessions/{id}")
    public SessionDetailResponse detailSession(@PathVariable Long id) {
        return sessionQueryService.detailSession(id);
    }

    @PostMapping("/sessions/{id}/cloturer")
    public ResponseEntity<SessionDetailResponse> cloturerSession(@PathVariable Long id) {
        return ResponseEntity.ok(sessionQueryService.cloturerSession(id));
    }

    @GetMapping("/etudiants/{etudiantId}/exercices")
    public List<MonExerciceResponse> exercicesDeLEtudiant(@PathVariable Long etudiantId) {
        return sessionQueryService.exercicesDeLEtudiant(etudiantId);
    }

    @GetMapping("/etudiants/{etudiantId}/relectures")
    public List<RelectureARendreResponse> relecturesAEtudiant(@PathVariable Long etudiantId) {
        return sessionQueryService.relecturesAEtudiant(etudiantId);
    }
}
