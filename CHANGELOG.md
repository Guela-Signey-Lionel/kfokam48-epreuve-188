# CHANGELOG — Assidu (épreuve finale KFOKAM48)

Toutes les évolutions notables de ce projet sont documentées dans ce fichier.

Le format s'inspire de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/),
la version suit [SemVer](https://semver.org/lang/fr/). Le journal de bord
raconte le « comment » et le « pourquoi » au fil de l'eau : voir
`docs/JOURNAL.md`.

## [Non publié]

> En revue : branches `feature/frontend-spring` (PR frontend) et
> `feature/rg5-deux-relecteurs` (PR changement de besoin), à fusionner dans
> `main`. La branche du changement de besoin porte aussi les évolutions
> EF3→EF5 (dépôt d'exercice, relecture, tableau), jusqu'ici empilées sur des
> branches séparées non fusionnées (`feature/ef3…` à `feature/ef5…`).

### Ajouté

- **EF3 — Dépôt d'exercice** : `POST /api/exercices` avec validation du lien
  (`400 LIEN_INVALIDE`), unicité par session/étudiant (`409
  EXERCICE_DEJA_DEPOSE`), remplacement du lien tant qu'aucun relecteur n'est
  assigné (RG12), assignation aléatoire du relecteur parmi les présents
  (RG6), exercice non assigné si aucun candidat (RG15).
- **EF4 — Rendre une relecture** : `POST /api/relectures/{id}`, note entière
  0–20 (`400 NOTE_INVALIDE`), auto-relecture interdite (`403
  AUTO_RELECTURE`), double soumission refusée (`409 RELECTURE_DEJA_RENDUE`).
- **EF5 — Tableau de bord** : `GET /api/tableau?promotionId=`,
  `404 PROMOTION_INCONNUE` (EF13), moyenne des notes reçues et compteur de
  relectures en attente (RG14).
- **Opérations libres** (contrat v1.1) : `GET /api/promotions`,
  `GET /api/promotions/{id}/etudiants`, `GET /api/sessions?promotionId=`,
  `GET /api/sessions/{id}`, `POST /api/sessions/{id}/cloturer` (RG2),
  `GET /api/etudiants/{id}/exercices` (RG7 : jamais l'identité du relecteur),
  `GET /api/etudiants/{id}/relectures`.
- **Frontend** : application Next.js câblée exclusivement sur l'API Spring —
  plus aucune route API propre, appels centralisés dans
  `frontend/src/lib/api-client.ts` via le préfixe `/backend-api` (rewrites
  vers `NEXT_PUBLIC_API_BASE_URL`). Écrans formateur (sessions, détail,
  présence manuelle, clôture, tableau) et étudiant (présence, dépôt, mes
  notes, relectures).

### Modifié

- **Changement de besoin (ouverture de l'enveloppe)** : chaque exercice est
  relu par **deux relecteurs** tirés au sort au lieu d'un seul ; l'exercice
  ne passe `RELU` que lorsque toutes ses relectures sont rendues. Migration
  `V3__deux_relecteurs_moyenne_provisoire.sql` : l'unicité
  `uk_relecture_exercice` cède la place à
  `uk_relecture_exercice_relecteur`.
- **Moyenne provisoire** : le tableau de bord expose `moyenneProvisoire` —
  vraie tant que des relectures restent en attente (EF7, RG5, RG14 et
  section 7 du cahier des charges mis à jour ; version 2 du document).
- Contrat d'API passé en **v1.1** : changelog du changement de besoin en
  en-tête et documentation des opérations libres réellement servies.

### Corrigé

- **Course critique sur l'unicité** (issue prête dans
  `docs/ISSUE_COURSE_CRITIQUE.md`) : deux requêtes simultanées de présence ou
  de dépôt passaient toutes deux le check applicatif, puis la seconde insert
  échouait sur la contrainte UNIQUE — le client recevait `500
  ERREUR_INTERNE` au lieu du `409 DEJA_PRESENT` / `409 EXERCICE_DEJA_DEPOSE`
  du contrat. `DataIntegrityViolationException` est désormais traduite en
  erreur métier autour des `save()` (tests unitaires rouges avant correctif,
  verts après).
- **Test d'intégration jamais exécuté** : surefire ignore les `*IT.java` ;
  `PresenceControllerIT` renommé `PresenceControllerTest`, il tourne
  désormais à chaque `mvnw test`.
- **Dépôt frontend imbriqué** : `frontend` était tracé comme gitlink (repo
  embarqué sans `.gitmodules`), donc invisible sur GitHub (sous-module vide)
  et non conforme au livrable « dépôt unique ». Le contenu réel du frontend
  est versionné dans ce dépôt.

### Retiré (périmètre sacrifié, assumé)

Pour absorber le changement de besoin (voir cahier des charges, section 3) :
remplacement d'un relecteur défaillant, rattrapage automatique quand un seul
candidat est présent, export CSV/PDF du tableau de bord, détail par
relecteur côté étudiant relu.

## [0.1.0] — 25/09/2026 · jalon `[JALON] v0.1`

### Ajouté

- **Analyse et conception** (jalon `[JALON] analyse`) : cahier des charges
  (13 exigences fonctionnelles, 15 règles de gestion, zones d'ombre tranchées
  en section 7), trois diagrammes Mermaid (`docs/diagrammes/`), contrat d'API
  `api/contrat.yaml` figé.
- **EF1 — Ouverture de session** : `POST /api/sessions`, code de présence à
  6 caractères sans caractères ambigus, expiration à 15 minutes (RG1).
- **EF2 — Marquer sa présence** : `POST /api/presences` avec `400
  CODE_INCONNU`, `410 CODE_EXPIRE`, `409 DEJA_PRESENT` (RG2), blocage
  2 minutes après 5 échecs (RG3, global à l'étudiant).
- **EF11 — Présence manuelle du formateur** (fusion PR #3) :
  `POST /api/sessions/{id}/presences-manuelles`, source `FORMATEUR` (RG13).
- **Squelette technique** : Spring Boot 3.3 (Java 17, Maven, wrapper commité),
  PostgreSQL + Flyway (`V1__init.sql`, données de démo `V2__donnees_demo.sql`),
  `ddl-auto=validate` hors tests, gestion d'erreurs centralisée au format
  `{ code, message }` (B2–B5) ; tests sur H2 en mémoire (profil `test`) :
  règles métier (`RelectureServiceTest`) et intégration MockMvc
  (`PresenceControllerTest`).

### Sécurité

- Pas d'authentification (Q1) : risque assumé et documenté (ENF6, section 7
  du cahier des charges).

[Non publié]: https://github.com/Guela-Signey-Lionel/kfokam48-epreuve-188/compare/main...feature/rg5-deux-relecteurs
[0.1.0]: https://github.com/Guela-Signey-Lionel/kfokam48-epreuve-188/releases
