package com.kfokam48.epreuve.backend.repository;

import com.kfokam48.epreuve.backend.entity.Exercice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ExerciceRepository extends JpaRepository<Exercice, Long> {
    Optional<Exercice> findBySessionIdAndEtudiantId(Long sessionId, Long etudiantId);
}
