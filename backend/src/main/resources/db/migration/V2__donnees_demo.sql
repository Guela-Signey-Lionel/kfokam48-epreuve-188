-- Données de démonstration chargées au démarrage (exigées par le sujet, section "Démarrage").

INSERT INTO promotion (id, nom) VALUES (1, 'KFOKAM48');

INSERT INTO etudiant (id, nom, promotion_id) VALUES
    (1, 'Aïcha Ngono', 1),
    (2, 'Brice Owona', 1),
    (3, 'Carine Mballa', 1),
    (4, 'David Fotso', 1);

-- Ajuste les séquences après les inserts à ID fixe (Postgres).
SELECT setval(pg_get_serial_sequence('promotion', 'id'), (SELECT MAX(id) FROM promotion));
SELECT setval(pg_get_serial_sequence('etudiant', 'id'), (SELECT MAX(id) FROM etudiant));
