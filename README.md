# KFOKAM48 — Épreuve finale fullstack

Backend Spring Boot (API de gestion de présence, dépôt et relecture
d'exercices) + frontend à réaliser en Next.js. Voir `docs/CAHIER_DES_CHARGES.md`
pour l'analyse complète et `api/contrat.yaml` pour le contrat d'API.

## Démarrage

```bash
docker compose up
```

Démarre PostgreSQL et le backend (port `8080`), avec les migrations Flyway et
les données de démonstration (`V2__donnees_demo.sql`) appliquées automatiquement.

Sans Docker, trois commandes (PostgreSQL doit tourner en local sur `5432`,
base/rôle `kfokam48`/`kfokam48`) :

```bash
cd backend
./mvnw clean package -DskipTests
java -jar target/backend.jar
```

## Tests

```bash
cd backend
./mvnw test
```

Tournent sur H2 en mémoire (profil `test`) — aucune base locale requise.

## Frontend

`frontend/` est volontairement vide. Framework prévu : **Next.js** — à
justifier en une ligne ici une fois le choix confirmé (contrainte F1).

## Structure

```
docs/            cahier des charges, diagrammes (Mermaid)
api/             contrat.yaml — contrat d'API imposé
backend/         Spring Boot (Java 17, Maven, PostgreSQL, Flyway)
frontend/        Next.js (à faire)
```

## Décisions techniques prises dans ce squelette

Le sujet précise que la demande client est volontairement incomplète et
contradictoire (section 7 du cahier des charges à compléter). Deux points
techniques significatifs ont été tranchés directement dans le code — à
documenter, discuter ou changer dans ta propre analyse :

- **Q10 vs Q15 (modification de note)** : Q10 dit la note modifiable tant que
  le formateur n'a pas clôturé la session ; Q15 dit qu'elle est définitive dès
  l'envoi. `RelectureService` retient Q15 (une relecture `RENDUE` est
  définitive, pas de ré-ouverture). Revois cette décision si ton analyse
  conclut autrement.
- **Assignation du relecteur au dépôt** : le relecteur est tiré au sort parmi
  les étudiants déjà marqués présents à la session, au moment du dépôt de
  l'exercice. Si personne n'est encore présent, l'exercice reste `DEPOSE` sans
  relecteur assigné (aucun mécanisme de réassignation différée n'est
  implémenté — c'est le "trou" que le sujet t'invite à repérer).
- **Remplacement du lien (Q13)** : autorisé tant qu'aucune ligne `relecture`
  n'existe pour l'exercice (c'est-à-dire tant qu'aucun relecteur n'a été
  assigné). Si ton analyse définit "commencé à relire" différemment (par
  exemple : tant que le relecteur n'a pas rendu sa note), adapte
  `ExerciceService.deposerExercice`.

## Contraintes techniques respectées

- **B1** : Java 17, Maven, wrapper `mvnw` commité.
- **B2** : `api/contrat.yaml` respecté à la lettre (chemins, verbes, codes de
  statut, format d'erreur `{code, message}`).
- **B3** : contrôleur / service / repository séparés ; DTOs dédiés, aucune
  entité JPA exposée en JSON.
- **B4** : validation des entrées (Bean Validation) + `@RestControllerAdvice`
  centralisé ; aucune stack trace n'est renvoyée au client.
- **B5** : schéma versionné par Flyway (`backend/src/main/resources/db/migration`),
  `ddl-auto=validate` en dehors des tests.
- **B6** : `RelectureServiceTest` (règle métier réelle : auto-relecture
  interdite, note hors intervalle, double soumission) et
  `PresenceControllerIT` (test d'intégration MockMvc sur `/api/presences`,
  H2 en mémoire, exécutable sur un poste vierge).
