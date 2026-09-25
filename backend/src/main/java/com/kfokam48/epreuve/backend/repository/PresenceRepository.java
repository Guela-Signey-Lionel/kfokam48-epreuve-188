package com.kfokam48.epreuve.backend.repository;

import com.kfokam48.epreuve.backend.entity.Presence;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PresenceRepository extends JpaRepository<Presence, Long> {
}
