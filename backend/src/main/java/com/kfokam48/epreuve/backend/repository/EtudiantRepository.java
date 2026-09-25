package com.kfokam48.epreuve.backend.repository;

import com.kfokam48.epreuve.backend.entity.Etudiant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EtudiantRepository extends JpaRepository<Etudiant, Long> {
    List<Etudiant> findByPromotionId(Long promotionId);
}
