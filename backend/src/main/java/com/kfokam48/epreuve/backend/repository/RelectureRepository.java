package com.kfokam48.epreuve.backend.repository;

import com.kfokam48.epreuve.backend.entity.Relecture;
import com.kfokam48.epreuve.backend.entity.StatutRelecture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RelectureRepository extends JpaRepository<Relecture, Long> {

    // Changement de besoin (V3) : plusieurs relectures possibles par exercice.
    List<Relecture> findByExerciceId(Long exerciceId);

    long countByRelecteurIdAndStatutAndExercice_Session_PromotionId(
            Long relecteurId, StatutRelecture statut, Long promotionId);

    List<Relecture> findByRelecteurIdOrderByCreeAtDesc(Long relecteurId);

    // Changement de besoin (V3) : la moyenne est provisoire tant que des
    // relectures de (ou pour) l'étudiant sont encore en attente.
    boolean existsByExercice_Etudiant_IdAndExercice_Session_PromotionIdAndStatut(
            Long etudiantId, Long promotionId, StatutRelecture statut);

    /**
     * Moyenne des notes rendues reçues par un étudiant sur une promotion
     * (RG14). Remplace le filtrage en mémoire du squelette ; renvoie null
     * quand aucune note n'est disponible.
     */
    @Query("""
            select avg(r.note) from Relecture r
            where r.exercice.etudiant.id = :etudiantId
              and r.exercice.session.promotion.id = :promotionId
              and r.statut = com.kfokam48.epreuve.backend.entity.StatutRelecture.RENDUE
            """)
    Double moyenneDesNotesRecues(@Param("etudiantId") Long etudiantId,
                                 @Param("promotionId") Long promotionId);
}
