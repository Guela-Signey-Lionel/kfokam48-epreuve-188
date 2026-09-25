# Issue prête à coller — GitHub

> Créer l'issue sur https://github.com/Guela-Signey-Lionel/kfokam48-epreuve-188/issues/new
> puis la refermer par le commit/PR du correctif (`fix:`), conformément à la
> Definition of Done (section 10 du cahier des charges).

---

**Titre :** Deux soumissions simultanées → 500 ERREUR_INTERNE au lieu de 409 (course critique sur l'unicité)

**Étiquettes suggérées :** `bug`, `backend`, `contrat-api`

**Corps :**

## Constat

`POST /api/presences` et `POST /api/exercices` vérifient l'absence de doublon
**par une lecture applicative** (`findBySessionIdAndEtudiantId`) **avant**
l'insert. Deux requêtes simultanées du même couple (session, étudiant)
passent toutes deux ce check, puis la deuxième insert échoue en base sur la
contrainte UNIQUE (`uk_presence_session_etudiant` / `uk_exercice_session_etudiant`).

Sans traduction, `DataIntegrityViolationException` remonte jusqu'au
`GlobalExceptionHandler` et le client reçoit :

```json
{ "code": "ERREUR_INTERNE", "message": "Une erreur inattendue est survenue." }
```

avec le statut **500**, alors que le contrat impose :

- `409 DEJA_PRESENT` pour un double marquage de présence ;
- `409 EXERCICE_DEJA_DEPOSE` pour un double dépôt.

## Scénario de reproduction

1. Ouvrir une session (code valide, non expiré).
2. Envoyer **en parallèle** deux `POST /api/presences` avec le même
   `(code, etudiantId)` (ex. deux onglets, double-clic sur le bouton).
3. Une des deux réponses est `201`, l'autre est `500 ERREUR_INTERNE`
   au lieu de `409 DEJA_PRESENT`. Idem pour deux dépôts d'exercice
   simultanés → `500` au lieu de `409 EXERCICE_DEJA_DEPOSE`.

## Cause

Fenêtre TOCTOU entre le `findBy...` (vide) et le `save()` : la contrainte
d'unicité en base est la seule vraie garantie, mais sa violation n'est pas
traduite en erreur métier.

## Correctif attendu

Capturer `DataIntegrityViolationException` autour du `save()` dans
`PresenceService.marquerPresence` / `ajouterPresenceManuelle` et
`ExerciceService.deposerExercice`, et la traduire respectivement en
`DejaPresentException` (409) / `ExerciceDejaDeposeException` (409).

## Test

`PresenceServiceTest.traduitLaPerteDeCourseContrainteUniqueEnDejaPresent` et
`ExerciceServiceTest.traduitLaPerteDeCourseContrainteUniqueEnExerciceDejaDepose`
simulent la perte de course (le `save` lève `DataIntegrityViolationException`)
et échouent avant correctif, passent après.
