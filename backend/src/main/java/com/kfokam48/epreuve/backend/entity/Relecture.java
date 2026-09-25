package com.kfokam48.epreuve.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "relecture")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Relecture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "exercice_id", nullable = false, unique = true)
    private Exercice exercice;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "relecteur_id", nullable = false)
    private Etudiant relecteur;

    private Integer note; // 0..20, entier — null tant que non rendue (RG9)

    @Column(columnDefinition = "TEXT")
    private String commentaire;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutRelecture statut;

    @Column(name = "cree_at", nullable = false)
    private LocalDateTime creeAt;

    @Column(name = "mise_a_jour_at")
    private LocalDateTime miseAJourAt;
}
