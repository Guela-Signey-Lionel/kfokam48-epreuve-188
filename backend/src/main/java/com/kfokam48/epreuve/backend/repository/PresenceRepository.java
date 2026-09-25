package com.kfokam48.epreuve.backend.repository;

import com.kfokam48.epreuve.backend.entity.Presence;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PresenceRepository extends JpaRepository<Presence, Long> {
    Optional<Presence> findBySessionIdAndEtudiantId(Long sessionId, Long etudiantId);
}
