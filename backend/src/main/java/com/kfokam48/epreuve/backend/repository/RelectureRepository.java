package com.kfokam48.epreuve.backend.repository;

import com.kfokam48.epreuve.backend.entity.Relecture;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RelectureRepository extends JpaRepository<Relecture, Long> {
    Optional<Relecture> findByExerciceId(Long exerciceId);
}
