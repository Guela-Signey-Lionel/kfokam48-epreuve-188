package com.kfokam48.epreuve.backend.repository;

import com.kfokam48.epreuve.backend.entity.TentativePresenceEchouee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface TentativePresenceEchoueeRepository extends JpaRepository<TentativePresenceEchouee, Long> {
    List<TentativePresenceEchouee> findByEtudiantIdAndTenteeAtAfter(Long etudiantId, LocalDateTime after);
}
