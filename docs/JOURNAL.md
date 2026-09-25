# Journal de bord — <matricule>

> Une entrée **par étape**, écrite **au moment où tu la termines**, pas à la fin de la journée.
> Trois lignes suffisent. Un journal rédigé d'un bloc juste avant de soumettre se repère
> immédiatement dans l'historique Git et ne compte pas.

Chaque entrée répond aux trois mêmes questions :

- **Fait** — ce que tu viens de terminer
- **Bloqué** — ce qui t'a coûté du temps, et combien
- **IA** — ce que tu lui as demandé, et **comment tu as vérifié sa réponse**

---

## Étape 1 — Analyse et conception

**Fait :** cahier des charges (9 exigences fonctionnelles, 12 règles de gestion), les trois diagrammes en Mermaid, 11 issues créées, contrat d'API complété, commit `[JALON] analyse` poussé.

**Bloqué :** 12 min sur la contradiction entre Q10 et Q15. Tranchée en faveur de Q10 : Q11 décrit un usage réel et concret du formateur, Q15 n'est qu'une intention générale. Noté en section 7.

**IA :** m'a proposé un découpage en 18 tickets, j'en ai retenu 11. Les autres étaient des tâches techniques (« créer l'entité », « configurer Flyway »), pas des résultats utilisateur. Vérifié en relisant chaque titre : est-ce que le client le comprendrait ?

---

## Étape 2 — Première version

**Fait :** backend EF1→EF5 (présence, dépôt avec assignation des relecteurs, relecture, tableau) + frontend Next.js câblé sur l'API Spring uniquement (zéro route API propre, rewrites `/backend-api` → backend). Découverte et correction d'un bug de course critique sur les doubles dépôts/présences simultanés.

**Bloqué :** 40 min sur la course critique : deux POST simultanés passaient tous deux le check d'unicité applicatif, puis l'insert échouait en base → 500 au lieu du 409 du contrat. Reproduit en test unitaire simulé (contrainte unique levée au save), puis traduit en exception métier.

**IA :** a généré la première version des écrans et proposé la traduction d'exception au save. Vérifié en relisant le scénario de course à la main (deux `curl` parallèles) et en vérifiant que le test échoue avant, puis passe après le correctif.

---

## Étape 3 — Enveloppe

**Fait :** changement de besoin absorbé : migration `V3` (deux relecteurs par exercice, unicité sur le couple exercice/relecteur), statut `RELU` seulement quand toutes les relectures sont rendues, moyenne avec drapeau `moyenneProvisoire` au tableau, contrat d'API en v1.1, cahier des charges (EF7, RG5, RG14, section 7) et diagramme D2 mis à jour.

**Bloqué :** 20 min pour arbitrer le cas « un seul autre étudiant présent » (un seul relecteur assigné, sans rattrapage) et le relecteur défaillant (pas de remplaçant) — deux réductions de périmètre assumées et documentées.

**IA :** a proposé de sortir l'export CSV et la réassignation pour tenir le budget temps. Vérifié que rien dans les exigences Must ne les mentionne, puis validé.

**Ce que j'ai sorti du périmètre pour absorber le changement, et pourquoi :**

- Remplacement d'un relecteur défaillant et rattrapage quand un seul candidat est présent : le changement de besoin rend ces mécanismes plus complexes pour un bénéfice marginal sur une promo de quelques dizaines d'étudiants.
- Export du tableau de bord (CSV/PDF) : absent de Q16, pur confort formateur.
- Détail par relecteur côté étudiant relu : RG7 n'exige que la note et le commentaire.

---

## Étape 4 — Version finale

**Fait :**

**Bloqué :**

**IA :**

---

## Étape 5 — Épreuve Git

**Fait :**

**Bloqué :**

**IA :**

---

## Étape 6 — Soumission

**Fait :**

**Ce que je referais autrement avec une journée de plus :**
