-- Schéma initial — voir docs/diagrammes/D2 pour le modèle de données correspondant.

CREATE TABLE promotion (
    id          BIGSERIAL PRIMARY KEY,
    nom         VARCHAR(120) NOT NULL
);

CREATE TABLE etudiant (
    id              BIGSERIAL PRIMARY KEY,
    nom             VARCHAR(150) NOT NULL,
    promotion_id    BIGINT NOT NULL REFERENCES promotion(id)
);

CREATE INDEX idx_etudiant_promotion ON etudiant(promotion_id);

CREATE TABLE session_cours (
    id              BIGSERIAL PRIMARY KEY,
    titre           VARCHAR(200) NOT NULL,
    promotion_id    BIGINT NOT NULL REFERENCES promotion(id),
    code            VARCHAR(12) NOT NULL,
    ouverture_at    TIMESTAMP NOT NULL,
    expiration_at   TIMESTAMP NOT NULL,
    statut          VARCHAR(20) NOT NULL DEFAULT 'OUVERTE' -- OUVERTE | CLOTUREE
);

CREATE UNIQUE INDEX idx_session_code ON session_cours(code);
CREATE INDEX idx_session_promotion ON session_cours(promotion_id);

CREATE TABLE presence (
    id              BIGSERIAL PRIMARY KEY,
    session_id      BIGINT NOT NULL REFERENCES session_cours(id),
    etudiant_id     BIGINT NOT NULL REFERENCES etudiant(id),
    source          VARCHAR(10) NOT NULL, -- ETUDIANT | FORMATEUR (RG13 / Q14)
    marquee_at      TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uk_presence_session_etudiant UNIQUE (session_id, etudiant_id)
);

CREATE TABLE exercice (
    id              BIGSERIAL PRIMARY KEY,
    session_id      BIGINT NOT NULL REFERENCES session_cours(id),
    etudiant_id     BIGINT NOT NULL REFERENCES etudiant(id),
    lien            VARCHAR(500) NOT NULL,
    statut          VARCHAR(30) NOT NULL DEFAULT 'DEPOSE', -- DEPOSE | EN_ATTENTE_RELECTURE | RELU
    depose_at       TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uk_exercice_session_etudiant UNIQUE (session_id, etudiant_id)
);

CREATE TABLE relecture (
    id              BIGSERIAL PRIMARY KEY,
    exercice_id     BIGINT NOT NULL REFERENCES exercice(id),
    relecteur_id    BIGINT NOT NULL REFERENCES etudiant(id),
    note            INTEGER, -- 0..20, NULL tant que non rendue (RG9)
    commentaire     TEXT,
    statut          VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE', -- EN_ATTENTE | RENDUE
    cree_at         TIMESTAMP NOT NULL DEFAULT now(),
    mise_a_jour_at  TIMESTAMP,
    CONSTRAINT uk_relecture_exercice UNIQUE (exercice_id) -- RG6 : un seul relecteur par exercice
);

-- RG (Q4) : l'étudiant se trompe de code (le code n'appartient à aucune
-- session), pas d'un blocage propre à une session -> pas de session_id ici.
CREATE TABLE tentative_presence_echouee (
    id              BIGSERIAL PRIMARY KEY,
    etudiant_id     BIGINT NOT NULL REFERENCES etudiant(id),
    tentee_at       TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_tentative_etudiant ON tentative_presence_echouee(etudiant_id);
