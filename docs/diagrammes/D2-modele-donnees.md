# D2 — Modèle de données

> Doit correspondre à `backend/src/main/resources/db/migration/V1__init.sql`
> (base) puis `V3__deux_relecteurs_moyenne_provisoire.sql` (changement de
> besoin). Si tu modifies le schéma, mets ce diagramme à jour dans le même commit.

```mermaid
erDiagram
    PROMOTION ||--o{ ETUDIANT : compte
    PROMOTION ||--o{ SESSION_COURS : concerne
    SESSION_COURS ||--o{ PRESENCE : enregistre
    ETUDIANT ||--o{ PRESENCE : marque
    SESSION_COURS ||--o{ EXERCICE : recoit
    ETUDIANT ||--o{ EXERCICE : depose
    EXERCICE ||--o{ RELECTURE : donne_lieu_a
    ETUDIANT ||--o{ RELECTURE : relit

    PROMOTION {
        bigint id PK
        varchar nom
    }
    ETUDIANT {
        bigint id PK
        varchar nom
        bigint promotion_id FK
    }
    SESSION_COURS {
        bigint id PK
        varchar titre
        bigint promotion_id FK
        varchar code
        timestamp ouverture_at
        timestamp expiration_at
        varchar statut
    }
    PRESENCE {
        bigint id PK
        bigint session_id FK
        bigint etudiant_id FK
        varchar source
        timestamp marquee_at
    }
    EXERCICE {
        bigint id PK
        bigint session_id FK
        bigint etudiant_id FK
        varchar lien
        varchar statut
        timestamp depose_at
    }
    RELECTURE {
        bigint id PK
        bigint exercice_id FK
        bigint relecteur_id FK
        integer note
        text commentaire
        varchar statut
        timestamp cree_at
        timestamp mise_a_jour_at
    }
```

**V3 — changement de besoin :** la relation EXERCICE–RELECTURE passe de
`||--o|` (un seul relecteur, contrainte `uk_relecture_exercice`) à `||--o{`
(jusqu'à deux relecteurs, contrainte `uk_relecture_exercice_relecteur` sur le
couple exercice/relecteur). La moyenne du tableau de bord devient
**provisoire** tant que des relectures restent en attente.
