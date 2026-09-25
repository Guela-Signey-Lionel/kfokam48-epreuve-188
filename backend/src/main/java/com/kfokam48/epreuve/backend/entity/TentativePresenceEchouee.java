package com.kfokam48.epreuve.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Trace des saisies de code invalides, utilisée pour appliquer la règle (Q4) :
 * après 5 échecs consécutifs, l'étudiant est bloqué 2 minutes.
 */
@Entity
@Table(name = "tentative_presence_echouee")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TentativePresenceEchouee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "etudiant_id", nullable = false)
    private Etudiant etudiant;

    @Column(name = "tentee_at", nullable = false)
    private LocalDateTime tenteeAt;
}
