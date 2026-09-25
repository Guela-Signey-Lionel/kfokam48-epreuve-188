-- Changement de besoin (ouverture de l'enveloppe, étape 3) :
-- chaque exercice est relu par DEUX relecteurs au lieu d'un seul.
-- La moyenne du tableau de bord devient "provisoire" tant que des
-- relectures restent en attente (voir cahier des charges, section 7).

-- RG5 modifiée : un exercice n'a plus "exactement un" relecteur.
-- On supprime l'unicité exercice -> relecture unique...
ALTER TABLE relecture DROP CONSTRAINT uk_relecture_exercice;

-- ... remplacée par : un même relecteur ne peut pas être assigné deux fois
-- au même exercice (défense en profondeur de RG4, l'auteur étant de toute
-- façon exclu du tirage côté application).
ALTER TABLE relecture
    ADD CONSTRAINT uk_relecture_exercice_relecteur UNIQUE (exercice_id, relecteur_id);
