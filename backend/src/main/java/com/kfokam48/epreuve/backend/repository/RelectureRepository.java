package com.kfokam48.epreuve.backend.repository;

import com.kfokam48.epreuve.backend.entity.Relecture;
import com.kfokam48.epreuve.backend.entity.StatutRelecture;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RelectureRepository extends JpaRepository<Relecture, Long> {
    Optional<Relecture> findByExerciceId(Long exerciceId);

    long countByRelecteurIdAndStatutAndExercice_Session_PromotionId(
            Long relecteurId, StatutRelecture statut, Long promotionId);
}
