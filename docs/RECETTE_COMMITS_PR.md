# Recette — commits et PR (à exécuter soi-même)

> **Rien n'est committé** : tout le travail réalisé est dans l'arbre de travail.
> Ce document est la recette exacte pour le verser en **deux branches séparées**
> (une par sujet), avec les messages de commit et le corps des PR prêts à coller.
> Convention du dépôt : `feat(EFx): …` / `fix: …`, en français.

## État des lieux

- `feature/ef3-depot-exercice`, `feature/ef4-rendre-relecture`,
  `feature/ef5-tableau-bord` : empilement EF3→EF5 déjà commité sur ces
  branches (PRs #1, #2, #4, #5 ouvertes sur GitHub).
- `feature/frontend-api-spring` (branche courante) : contient TOUT le travail
  non commité décrit ci-dessous. `main` est en retard sur ce travail.

## Deux branches prévues, une par sujet

| Branche                  | Sujet                                                      | Contenu (chemins)                                                                                     |
|--------------------------|------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| `feature/frontend-spring`| Câblage du frontend sur l'API Spring + nettoyage            | `frontend/**` (hors worklog), `README.md`                                                              |
| `feature/rg5-deux-relecteurs` | Changement de besoin : 2 relecteurs + moyenne provisoire | `backend/**`, `api/contrat.yaml`, `docs/CAHIER_DES_CHARGES.md`, `docs/diagrammes/D2-modele-donnees.md`, `docs/JOURNAL.md`, `docs/ISSUE_COURSE_CRITIQUE.md` |

Le correctif de la course critique (`PresenceService`, `ExerciceService` +
les 2 tests) et son issue vivent dans la **branche 2** : le bug a été
découvert et corrigé sur le code EF3 (dépôt) et EF2 (présence) que cette
branche porte aussi via l'empilement. Créer aussi l'issue GitHub depuis
`docs/ISSUE_COURSE_CRITIQUE.md` et la refermer avec le commit `fix:`.

## ⚠️ Étape 0 — AVANT TOUT : absorber le dépôt frontend imbriqué

La racine trace `frontend` comme **gitlink** (repo imbriqué sans
`.gitmodules`) : sur GitHub, `frontend/` s'afficherait comme un sous-module
**vide** — le correcteur ne verrait aucun code front, et le sujet impose un
**dépôt unique**. À corriger en tout premier, avant la branche 1 :

```bash
git rm --cached frontend                 # retire le gitlink de l'index
mv frontend/.git /tmp/assidu-frontend-git-backup   # préservé au cas où
git add frontend/                        # ré-ajoute les VRAIS fichiers
git status --short | head                # vérifier que src/ etc. sont suivis
```

## Branch 1 — `feature/frontend-spring`

```bash
git checkout -b feature/frontend-spring
git reset                                # désindexe tout, arbre de travail INTACT
git add frontend                          # le front seul (⚠️ jamais --worktree ici :
                                          # cela écraserait le travail de l'autre branche)
```

Commit 1 (nettoyage + câblage) :

```bash
git commit -m "$(cat <<'EOF'
feat(frontend): câblage complet sur l'API Spring et nettoyage du template

Suppression de tout ce qui n'appartient pas au produit : routes API Next,
Prisma (schéma, seed, client), mini-services, exemples websocket, scripts
Z.ai, Caddyfile, bun.lock, composants shadcn/ui inutilisés. L'application
n'a plus aucune route API propre : tous les appels partent de
src/lib/api-client.ts vers /backend-api, réécrit vers
${NEXT_PUBLIC_API_BASE_URL}/api.

Ajout de cloturerSession au client, .env.example documenté, scripts npm
simplifiés (dev/build/start/lint/typecheck), reactStrictMode activé.

🤖 Generated with Codebuff
Co-Authored-By: Codebuff <noreply@codebuff.com>
EOF
)"
```

Commit 0 (à faire en premier sur cette branche, réf. étape 0) :

```bash
git commit -m "$(cat <<'EOF'
fix(repo): absorber le dépôt frontend imbriqué en fichiers suivis

gitlink sans .gitmodules = frontend invisible sur GitHub (sous-module
vide) et dépôt unique non conforme au livrable attendu.

🤖 Generated with Codebuff
Co-Authored-By: Codebuff <noreply@codebuff.com>
EOF
)"
```

Puis ouvrir la PR vers `main` :

**Titre :** `feat(frontend): câblage complet sur l'API Spring + nettoyage du template`

**Corps :**

> ## Résumé
> - Zéro route API Next : le frontend consomme exclusivement le backend Spring via `/backend-api` (rewrites vers `NEXT_PUBLIC_API_BASE_URL`).
> - Suppression du template Z.ai (Prisma, mini-services, examples, .zscripts, Caddyfile, bun.lock) et de 32 composants shadcn/ui inutilisés.
> - `npm run build` vert (Next 16, Turbopack), typecheck strict activé (plus d'`ignoreBuildErrors`).
>
> ## Vérification
> - `cd frontend && npm install && npm run build`
> - `docker compose up` puis http://localhost:3000 : présence, dépôt, relectures et tableau fonctionnels.

## Branch 2 — `feature/rg5-deux-relecteurs`

```bash
git checkout feature/frontend-api-spring   # tout est encore dans l'arbre
git checkout -b feature/rg5-deux-relecteurs
git reset                                  # désindexe tout, arbre de travail INTACT
git add backend api docs README.md         # backend + contrat + doc (README inclus ici)
```

Commits (dans cet ordre, messages prêts) :

```bash
git commit -m "$(cat <<'EOF'
fix(backend): traduire la perte de course d'unicité en 409 contractuel

Deux requêtes simultanées (présence ou dépôt) passent toutes deux le check
applicatif, puis la seconde insert échoue sur la contrainte UNIQUE : le
client recevait 500 ERREUR_INTERNE au lieu de 409 DEJA_PRESENT /
EXERCICE_DEJA_DEPOSE. DataIntegrityViolationException est désormais capturée
autour des save() et traduite en erreur métier. Tests unitaires fournis
(rouges avant correctif, verts après). Refs issue « course critique ».

🤖 Generated with Codebuff
Co-Authored-By: Codebuff <noreply@codebuff.com>
EOF
)"

git add api/contrat.yaml backend/src/main/resources/db/migration/V3__deux_relecteurs_moyenne_provisoire.sql
git commit -m "$(cat <<'EOF'
feat(backend)!: changement de besoin — deux relecteurs par exercice et moyenne provisoire

Migration V3 : l'unicité uk_relecture_exercice cède la place à
uk_relecture_exercice_relecteur (couple exercice/relecteur). L'exercice ne
passe RELU que lorsque toutes ses relectures sont rendues ; le tableau de
bord expose moyenne + moyenneProvisoire. Le contrat d'API passe en v1.1
(changement documenté dans son en-tête).

🤖 Generated with Codebuff
Co-Authored-By: Codebuff <noreply@codebuff.com>
EOF
)"

git add docs backend/src/main/java
git commit -m "$(cat <<'EOF'
docs: cahier des charges v2, diagramme D2 et journal alignés sur le changement

EF7 et RG5 réécrites (deux relecteurs), RG14 avec drapeau provisoire,
décision tracée en section 7, périmètre sorti explicité en section 3,
diagramme D2 mis à jour (EXERCICE ||--o{ RELECTURE), journal étapes 2-3.

🤖 Generated with Codebuff
Co-Authored-By: Codebuff <noreply@codebuff.com>
EOF
)"
```

Puis ouvrir la PR vers `main` :

**Titre :** `feat!: deux relecteurs par exercice + moyenne provisoire (V3)`

**Corps :**

> ## Résumé
> - Changement de besoin absorbé (ouverture de l'enveloppe) : chaque exercice est relu par **deux** relecteurs tirés au sort ; statut `RELU` seulement quand toutes les relectures sont rendues.
> - Migration Flyway `V3` (nouvelle contrainte d'unicité), contrat d'API **v1.1**, cahier des charges **v2** (EF7, RG5, RG14, section 7), diagramme D2 à jour.
> - Bonus : correctif de la course critique 500→409 (voir issue), avec tests unitaires fournis.
>
> ## Périmètre sacrifié (assumé, voir cahier des charges §3)
> Remplacement de relecteur défaillant, rattrapage mono-candidat, export CSV/PDF, détail par relecteur côté étudiant relu.
>
> ## Vérification
> - `cd backend && ./mvnw test` — tous verts (dont 2 nouveaux tests de course critique).
> - `docker compose up` : déposer un exercice avec ≥2 autres présents crée **deux** relectures.

## Après fusion

Mettre à jour `docs/SOUMISSION.md` (hash du commit final sur `main`) puis le
commit final `[JALON] v1.0` conformément à la démarche (section 10).
