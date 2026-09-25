# Cahier des charges — Assidu

**Auteur :** GUELA Signey Lionel . matricule : 188
**Version :** 2 (révisé après ouverture de l'enveloppe : deux relecteurs par
exercice, moyenne provisoire) · **Date :** Le 25 Septembre 2026
**Frontend choisi :** Next.js, parce que le rendu
serveur simplifie l'affichage du tableau de bord formateur et le typage
partagé avec le contrat d'API réduit les erreurs d'intégration.

## 1. Contexte et objectif

Dans le cadre de la formation KFOKAM48, les formateurs gèrent aujourd'hui la
présence, le dépôt des exercices et leur correction par les pairs de manière
informelle (feuille de présence papier, dépôts par messagerie, relecture non
tracée). Cela rend le suivi peu fiable : un formateur ne peut pas dire
rapidement qui a été présent, qui a rendu son exercice, ni ce qu'il a obtenu.

**Assidu** répond à ce besoin : une application qui couvre, pour une session
de cours donnée, l'ouverture d'un créneau de présence par le formateur, la
saisie de cette présence par l'étudiant, le dépôt d'un exercice, son
assignation automatique à un pair relecteur, la notation par ce pair, et la
restitution de l'ensemble sous forme de tableau de bord pour le formateur.

L'objectif n'est pas de remplacer la plateforme pédagogique existante, mais
de fiabiliser un processus précis et récurrent : présence → dépôt → relecture
par les pairs → suivi.

## 2. Acteurs et rôles

| Acteur    | Ce qu'il peut faire                                                                                                                                                                                                               |
|-----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Formateur | Ouvre une session et obtient un code de présence ; ajoute une présence manuellement en cas de souci technique d'un étudiant ; consulte le tableau de bord (présence, dépôts, moyennes, relectures en attente) par promotion.      |
| Étudiant  | Saisit le code pour marquer sa présence à une session ; dépose (ou remplace) le lien de son exercice pour une session ; consulte la note et le commentaire reçus sur son propre exercice, sans connaître l'identité du relecteur. |
| Relecteur | C'est un étudiant, dans son rôle de correcteur : il lui est assigné automatiquement l'exercice d'un pair (jamais le sien) et il rend une note et un commentaire.                                                                  |
| Système   | Génère le code de présence et son expiration ; choisit le relecteur au hasard parmi les étudiants présents ; applique les règles de gestion (expiration, blocage, unicité) sans intervention humaine.                             |

Il n'y a pas d'authentification (Q1) : l'étudiant se désigne en choisissant
son nom dans une liste. Il n'y a donc pas de notion de session utilisateur
sécurisée — voir section 5 pour les conséquences sur la sécurité, et section 7
pour l'hypothèse retenue sur l'identification du formateur.

## 3. Périmètre

**Inclus :**
- Ouverture d'une session de cours et génération d'un code de présence à
  durée de vie limitée.
- Saisie de présence par l'étudiant (par code) et par le formateur (manuelle).
- Dépôt et remplacement du lien d'un exercice par l'étudiant.
- Assignation automatique et aléatoire d'un relecteur parmi les étudiants
  présents à la session.
- Notation et commentaire d'un exercice par le relecteur assigné.
- Tableau de bord agrégé par promotion (présence, dépôts, moyenne, relectures
  en attente).

**Exclu :**
- Authentification et gestion de comptes (Q1) — aucun mot de passe, aucune
  session sécurisée.
- Édition ou suppression d'une session par le formateur après ouverture
  (seule la clôture est prévue).
- Notification (email, push) des étudiants ou des relecteurs.
- Statistiques au-delà de celles listées par le client (Q16) : pas d'export,
  pas d'historique inter-promotions, pas de classement.
- Modération du contenu des commentaires de relecture.
- Réassignation automatique d'un relecteur en cas d'absence de candidat au
  moment du dépôt (voir section 7, zone d'ombre non tranchée par le client).

**Sorti du périmètre pour absorber le changement de besoin (deux relecteurs,
moyenne provisoire) :**
- Le remplacement d'un relecteur défaillant : si l'un des deux relecteurs ne
  rend jamais sa relecture, aucun remplaçant n'est tiré — l'exercice est
  relu sur la ou les relectures rendues, la moyenne restant « provisoire ».
- Le rattrapage automatique quand un seul autre étudiant est présent : un
  seul relecteur est assigné, sans seconde assignation différée.
- L'export (CSV/PDF) du tableau de bord et toute statistique au-delà de Q16.
- L'affichage du détail des relectures individuelles côté étudiant déjà relu
  (il voit ses notes et commentaires, conformément à RG7, sans distinction
  par relecteur ni comparaison entre les deux correcteurs).

## 4. Exigences fonctionnelles

| Réf   | Exigence                                                                                          | Critère d'acceptation                                                                                                                                                                                      | Priorité |
|-------|---------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|
| EF1   | Le formateur ouvre une session de cours pour sa promotion.                                        | Quand le formateur soumet un titre et une promotion, un code de présence et une date d'expiration (ouverture + 15 min) sont retournés.                                                                     | Must     |
| EF2   | L'étudiant marque sa présence avec le code communiqué en session.                                 | Quand je saisis un code valide et non expiré, ma présence apparaît dans le tableau du formateur avec la source « ÉTUDIANT ».                                                                               | Must     |
| EF3   | Le système refuse un code inconnu, déjà expiré, ou une présence déjà enregistrée.                 | Un code inexistant renvoie une erreur « code inconnu » ; un code expiré renvoie « code expiré » ; une deuxième saisie pour la même session renvoie « déjà présent ».                                       | Must     |
| EF4   | L'étudiant est bloqué temporairement après plusieurs codes erronés.                               | Après 5 échecs consécutifs, toute nouvelle tentative est refusée pendant 2 minutes, même avec un code valide.                                                                                              | Must     |
| EF5   | L'étudiant dépose le lien de son exercice pour une session.                                       | Quand je soumets un lien valide pour une session à laquelle je suis rattaché, l'exercice est créé avec le statut « déposé » ou « en attente de relecture ».                                                | Must     |
| EF6   | L'étudiant peut remplacer le lien déposé tant qu'aucun relecteur ne lui a été assigné.            | Un deuxième dépôt sur la même session met à jour le lien existant tant qu'aucune relecture n'a démarré ; au-delà, il est refusé.                                                                           | Should   || EF7   | Le système assigne automatiquement les relecteurs à chaque exercice déposé.                                        | Dès qu'au moins un autre étudiant est marqué présent à la session, deux relecteurs sont tirés au sort parmi eux (jamais l'auteur — un seul si un seul candidat) et l'exercice passe « en attente de relecture ». *Modifié par le changement de besoin (section 7).* | Must     |
| EF8   | Le relecteur assigné note et commente l'exercice reçu.                                            | Quand le relecteur soumet une note entière (0–20) et un commentaire, la relecture passe « rendue » et l'exercice passe « relu ».                                                                           | Must     |
| EF9   | Le système refuse qu'un étudiant relise son propre exercice.                                      | Toute tentative de relecture où le relecteur correspond à l'auteur de l'exercice est rejetée.                                                                                                              | Must     |
| EF10  | L'étudiant relu consulte sa note et le commentaire reçus, sans connaître l'identité du relecteur. | La réponse contenant la note et le commentaire ne contient à aucun moment l'identifiant ou le nom du relecteur.                                                                                            | Must     |
| EF11  | Le formateur ajoute une présence manuellement.                                                    | Quand le formateur déclare la présence d'un étudiant pour une session, elle apparaît avec la source « FORMATEUR ».                                                                                         | Should   |
| EF12  | Le formateur consulte un tableau de bord par promotion.                                           | Pour chaque étudiant de la promotion, le tableau affiche : nombre de présences, nombre d'exercices déposés, moyenne des notes reçues (vide si aucune note), nombre de relectures qu'il lui reste à rendre. | Must     |
| EF13  | Le tableau de bord signale une promotion inconnue.                                                | Une requête sur un identifiant de promotion qui n'existe pas renvoie une erreur explicite plutôt qu'un tableau vide.                                                                                       | Should   |

## 5. Exigences non fonctionnelles

| Réf  | Exigence                                                                                                        | Comment on la vérifie                                                                                                                                      |
|------|-----------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------|
| ENF1 | Volumétrie modeste : une promotion compte au plus quelques dizaines d'étudiants, quelques sessions par semaine. | Aucun test de charge formel n'est requis ; le modèle de données et les index sont dimensionnés pour ce volume, pas pour du temps réel massif.              |
| ENF2 | Usage principalement mobile côté étudiant (saisie du code en cours, souvent depuis un téléphone).               | Le frontend est testé en résolution mobile (< 480 px) sur les trois écrans imposés.                                                                        |
| ENF3 | Temps de réponse perçu court sur les opérations de saisie (présence, dépôt, relecture).                         | Les opérations d'écriture répondent en dessous de 500 ms en local, sans appel externe bloquant dans la chaîne de traitement.                               |
| ENF4 | Le système reste utilisable sans connexion permanente forte côté étudiant.                                      | Le dépôt d'exercice reste possible en dehors de l'horaire strict de la session (RG11), pour compenser des soucis de connexion évoqués par le client (Q12). |
| ENF5 | Les erreurs métier sont toujours compréhensibles côté client, jamais une trace technique.                       | Toute erreur applicative respecte le format `{ "code", "message" }` du contrat ; aucune trace Spring ne doit apparaître en réponse.                        |
| ENF6 | Absence d'authentification assumée comme un risque accepté à ce stade.                                          | Documenté explicitement en section 7 : aucune protection contre l'usurpation de nom par un tiers connaissant le code de session.                           |

## 6. Règles de gestion

| Réf  | Règle                                                                                                                                                                                                       | Source                                                  |
|------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------|
| RG1  | Le code de présence expire 15 minutes après l'ouverture de la session.                                                                                                                                      | Q2                                                      |
| RG2  | Après expiration du code ou clôture de la session par le formateur, plus aucune présence ne peut être enregistrée avec ce code.                                                                             | Q2, Q3                                                  |
| RG3  | Après 5 tentatives de code erronées consécutives, l'étudiant est bloqué 2 minutes avant de pouvoir retenter.                                                                                                | Q4                                                      |
| RG4  | Un étudiant ne peut jamais relire son propre exercice.                                                                                                                                                      | Q5                                                      |
| RG5  | Un exercice est relu par **deux relecteurs** tirés au sort (un seul si un seul autre étudiant est présent). *Modifiée par le changement de besoin — initialement « exactement un relecteur » (Q6).*          | Q6 + changement de besoin (section 7)                   |
| RG6  | Le relecteur est choisi par le système, au hasard, parmi les étudiants déjà marqués présents à la session au moment du dépôt (hors l'auteur).                                                               | Q7                                                      |
| RG7  | L'étudiant relu voit la note et le commentaire reçus, jamais l'identité du relecteur.                                                                                                                       | Q8                                                      |
| RG8  | La note est un entier compris entre 0 et 20 inclus.                                                                                                                                                         | Q9                                                      |
| RG9  | Une relecture rendue est définitive et ne peut plus être modifiée.                                                                                                                                          | Q15 (contradiction avec Q10 — tranchée, voir section 7) |
| RG10 | Tant que le relecteur assigné n'a pas rendu sa relecture, l'exercice reste visible comme « en attente » dans le tableau de bord.                                                                            | Q11                                                     |
| RG11 | Un exercice peut être déposé même après la fin programmée de la session, tant que le formateur n'a pas clôturé la session.                                                                                  | Q12                                                     |
| RG12 | Le lien d'un exercice peut être remplacé tant qu'aucun relecteur ne lui a été assigné ; au-delà, il est figé.                                                                                               | Q13 (précisée, voir section 7)                          |
| RG13 | Une présence ajoutée manuellement par le formateur est marquée avec la source « FORMATEUR », distincte d'une présence saisie par l'étudiant.                                                                | Q14                                                     |
| RG14 | Le tableau de bord du formateur affiche, par étudiant : ses présences, le nombre d'exercices déposés, la moyenne de ses notes reçues (avec drapeau « provisoire » tant que des relectures sont en attente), et le nombre de relectures qu'il lui reste à faire. | Q16 + changement de besoin (section 7)                  |
| RG15 | Si, au moment du dépôt, aucun autre étudiant n'est encore marqué présent à la session, l'exercice reste déposé sans relecteur assigné (pas de réassignation automatique différée dans le périmètre actuel). | Trou identifié — hypothèse, voir section 7              |

## 7. Zones d'ombre, hypothèses et contradictions

| Point                                                                            | Réponse client (Qx) ou hypothèse                                                                                                                                                                | Décision retenue                                                                                                                                                                                      | Pourquoi                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
|----------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Modification d'une note après envoi                                              | Q10 dit que le relecteur peut corriger sa note tant que le formateur n'a pas clôturé la session ; Q15 dit qu'une fois validée, c'est définitif. Les deux réponses se contredisent frontalement. | Une relecture rendue est **définitive** (RG9) : on retient Q15.                                                                                                                                       | Q15 est la réponse la plus tardive et la plus explicite sur l'intention ("c'est plus honnête pour tout le monde") ; elle protège l'étudiant relu d'une note qui changerait après qu'il en a pris connaissance (EF10 lui donne l'accès immédiat à sa note). Autoriser la correction (Q10) rouvrirait cette garantie à tout moment avant clôture, ce qui est incohérent avec Q8/EF10.                                                                                    |
| Absence de relecteur disponible au dépôt                                         | Le client ne l'a pas anticipé : Q7 dit que le relecteur est choisi "parmi les étudiants présents à cette session", sans traiter le cas où personne d'autre n'est encore présent.                | L'exercice reste `DEPOSE`, sans relecteur assigné, jusqu'à nouvel événement. Aucune réassignation automatique n'est implémentée dans ce périmètre (RG15, EF7 en Must uniquement pour le cas nominal). | C'est le "trou" que le sujet indique explicitement ne pas avoir été vu par personne. Assigner un relecteur non présent violerait Q7 ; bloquer le dépôt violerait Q12 (dépôt possible même en dehors de la session). Laisser l'exercice non assigné est la seule option qui ne viole aucune réponse existante ; une réassignation périodique (ex. tâche planifiée qui retente à chaque nouvelle présence) est identifiée comme amélioration Could, hors périmètre Must. |
| Portée du blocage après échecs (Q4)                                              | Le client dit "bloquez-le deux minutes" sans préciser si le blocage est propre à une session ou global à l'étudiant.                                                                            | Le blocage est **global à l'étudiant**, indépendant de la session.                                                                                                                                    | Un code erroné ne désigne aucune session identifiable (par définition, le code ne correspond à rien) ; il est donc impossible de rattacher l'échec à une session précise. Bloquer globalement est aussi la lecture la plus prudente vis-à-vis du risque anti-devinette évoqué par le client lui-même ("sinon ils vont deviner les codes entre eux").                                                                                                                   |
| Exercice déposé pour une session où l'étudiant n'est pas (encore) marqué présent | Non traité par le client.                                                                                                                                                                       | Le dépôt d'exercice n'est pas conditionné à une présence préalable à la session.                                                                                                                      | Q12 autorise le dépôt même après la fin de la session (connexion tardive), ce qui rend peu cohérent d'exiger une présence déjà enregistrée au moment du dépôt. L'étudiant reste néanmoins rattaché à la session cible via `sessionId` + `etudiantId`.                                                                                                                                                                                                                  || Identification du formateur                                                      | Q1 traite uniquement l'authentification étudiant ("il choisit son nom dans une liste"). Rien n'est dit sur le formateur.                                                                        | Le formateur est traité, dans ce périmètre, comme un acteur non authentifié lui non plus (aucune notion de compte formateur dans le modèle actuel).                                                   | Cohérent avec l'absence générale d'authentification voulue par le client (Q1) et avec le périmètre "sans mot de passe" ; documenté ici comme un risque accepté (ENF6) plutôt que comme un oubli.                                                                                                                                       |
| **Changement de besoin (ouverture de l'enveloppe)** : le client demande désormais que chaque exercice soit relu par **deux relecteurs** et que la moyenne du tableau soit présentée comme **provisoire** tant que des relectures restent en attente | Demande nouvelle, en contradiction apparente avec Q6 (« un seul relecteur ») mais postérieure et plus spécifique.                                                                                                                                                | Migration `V3__deux_relecteurs_moyenne_provisoire.sql` : l'unicité `uk_relecture_exercice` est remplacée par `uk_relecture_exercice_relecteur` (couple exercice/relecteur). L'exercice ne passe `RELU` que lorsque **toutes** ses relectures sont rendues. Le tableau de bord expose `moyenne` + `moyenneProvisoire`. RG5 et EF7 sont réécrites ; le contrat d'API passe en v1.1. | La demande est postérieure à Q6 et plus précise : elle remplace la règle sans ambiguïté. Deux relecteurs donnent une note plus fiable ; le drapeau « provisoire » évite au formateur de prendre une décision sur une moyenne amenée à changer. Le périmètre sortant (section « Ce que j'ai sorti du périmètre » du JOURNAL, étape 3) absorbe ce surcoût. |

## 8. Contraintes techniques

- Backend : Java 17+, Spring Boot, Maven avec wrapper (`mvnw`) commité.
- Persistance : PostgreSQL, schéma exclusivement piloté par des migrations
  Flyway versionnées ; `ddl-auto` jamais utilisé hors des tests.
- Architecture en couches strictes : contrôleur → service → repository ;
  aucune requête base dans un contrôleur ; DTOs systématiques en frontière
  HTTP, aucune entité JPA sérialisée directement.
- Gestion des erreurs centralisée (`@RestControllerAdvice`), format de
  réponse d'erreur unique `{ "code", "message" }`.
- Frontend : Next.js, appels API isolés dans une couche dédiée, aucun calcul
  métier dupliqué côté client (la moyenne affichée vient toujours de l'API).
- Le contrat `api/contrat.yaml` fait foi : chemins, verbes et codes HTTP ne
  sont pas négociables une fois figés (section 9).
- Conteneurisation : `docker compose up` doit suffire à démarrer l'ensemble
  (base incluse) avec des données de démonstration.

## 9. Livrables

- Dépôt GitHub public unique, structuré `docs/` · `api/` · `backend/` ·
  `frontend/`.
- `docs/CAHIER_DES_CHARGES.md` (ce document) et les diagrammes Mermoid
  versionnés dans `docs/diagrammes/` (cas d'utilisation, modèle de données,
  séquence de la présence).
- `api/contrat.yaml` complété et figé avant le premier commit de code.
- Backlog sous forme d'issues GitHub, chacune reliée à une exigence EFx ou
  une règle RGx.
- Code source backend et frontend, avec tests et instructions de démarrage
  (`README.md`).
- `JOURNAL.md` tenu à jour à chaque étape, `CHANGELOG.md` cohérent avec
  l'historique Git, `SOUMISSION.md` rempli en fin d'épreuve.

## 10. Démarche prévue

1. Analyser le besoin et le client "en boîte", trancher les zones d'ombre
   (ce document), modéliser les données et le contrat d'API — avant toute
   ligne de code, jalon `[JALON] analyse`.
2. Prioriser le backlog (Must d'abord), construire la version 0.1 exercice
   par exercice, une branche et une PR par ticket — jalon `[JALON] v0.1`.
3. Ouvrir l'enveloppe, absorber le changement de besoin en répercutant
   migration, contrat et documentation dans des commits qui le disent
   explicitement.
4. Finaliser la version 1.0 : backlog restant trié, `CHANGELOG.md` et
   `README.md` à jour, testés depuis un clone vierge — jalon `[JALON] v1.0`.
5. Traiter l'épreuve Git indépendante sur le dépôt fourni.
6. Rédiger et déposer `SOUMISSION.md` avant l'échéance.

**Definition of Done** d'un ticket : le code respecte le contrat d'API et les
règles de gestion concernées, les couches sont respectées (section 8), au
moins un test couvre la règle métier si le ticket en introduit une nouvelle,
et l'issue correspondante est fermée par le commit ou la PR qui la résout.
