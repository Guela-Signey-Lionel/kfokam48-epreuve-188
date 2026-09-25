// Assidu — Client API typé pour le frontend.
//
// L'application ne possède plus aucune route API propre : tous les appels
// visent le backend Spring Boot via le préfixe /backend-api, que Next.js
// réécrit vers ${NEXT_PUBLIC_API_BASE_URL}/api (voir next.config.ts).
// En production, définir NEXT_PUBLIC_API_BASE_URL (ex. http://backend:8080).
//
// Types alignés sur les DTOs du backend (api/contrat.yaml) : Long = number,
// dates ISO 8601 en string. Format d'erreur normalisé { code, message } (ENF5).

const BASE = "/backend-api";

// ---------- Types partagés avec le contrat d'API ----------

export interface Promotion {
  id: number
  nom: string
  nbEtudiants: number
}

export interface EtudiantRef {
  id: number
  nom: string
}

export type SourcePresence = "ETUDIANT" | "FORMATEUR"
export type StatutSession = "OUVERTE" | "CLOTUREE"
export type StatutExercice = "DEPOSE" | "EN_ATTENTE_RELECTURE" | "RELU"
export type StatutRelecture = "EN_ATTENTE" | "RENDUE"

export interface SessionResponse {
  id: number
  code: string
  ouvertureAt: string
  expirationAt: string
}

export interface SessionItem {
  id: number
  titre: string
  code: string
  ouvertureAt: string
  expirationAt: string
  statut: StatutSession
  nbPresences: number
  nbExercices: number
}

export interface PresenceVue {
  id: number
  source: SourcePresence
  marqueeAt: string
  etudiant: EtudiantRef
}

export interface RelectureVue {
  statut: StatutRelecture
  note: number | null
  commentaire: string | null
}

export interface ExerciceVue {
  id: number
  lien: string
  statut: StatutExercice
  deposeAt: string
  etudiant: EtudiantRef
  relectures: RelectureVue[]
}

export interface SessionDetail {
  id: number
  titre: string
  code: string
  ouvertureAt: string
  expirationAt: string
  statut: StatutSession
  promotion: { id: number; nom: string }
  presences: PresenceVue[]
  exercices: ExerciceVue[]
}

export interface PresenceResult {
  id: number
  sessionId: number
  etudiantId: number
  source: SourcePresence
}

export interface ExerciceResult {
  id: number
  statut: StatutExercice
}

export interface RelectureARendre {
  id: number
  statut: StatutRelecture
  note: number | null
  commentaire: string | null
  exercice: {
    id: number
    lien: string
    statut: StatutExercice
    session: { id: number; titre: string }
    auteurNom: string
    deposeAt: string
  }
}

export interface MonExercice {
  id: number
  lien: string
  statut: StatutExercice
  deposeAt: string
  session: { id: number; titre: string; ouvertureAt: string }
  // RG7 : aucune identité de relecteur dans ces données.
  relectures: RelectureVue[]
}

export interface LigneTableau {
  etudiantId: number
  nom: string
  presences: number
  exercicesDeposes: number
  moyenne: number | null
  // Changement de besoin (V3) : vraie tant que des relectures restent en
  // attente — la moyenne peut encore évoluer.
  moyenneProvisoire: boolean
  relecturesEnAttente: number
}

// ---------- Erreur métier ----------

export interface ApiErreur {
  code: string
  message: string
}

export async function traiterErreur(res: Response): Promise<never> {
  let body: ApiErreur | null = null
  try {
    body = (await res.json()) as ApiErreur
  } catch {
    body = { code: "ERREUR_INTERNE", message: "Une erreur inattendue est survenue." }
  }
  throw body
}

// ---------- Helpers internes ----------

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" } })
  if (!res.ok) return traiterErreur(res)
  return (await res.json()) as T
}

async function postJson<T>(url: string, corps: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(corps),
  })
  if (!res.ok) return traiterErreur(res)
  return (await res.json()) as T
}

// ---------- API publique (backend Spring uniquement) ----------

export const api = {
  // Référence
  promotions: () => getJson<Promotion[]>(`${BASE}/promotions`),
  etudiantsDe: (promotionId: number) =>
    getJson<EtudiantRef[]>(`${BASE}/promotions/${promotionId}/etudiants`),

  // Sessions (contrat + opérations libres)
  ouvrirSession: (titre: string, promotionId: number) =>
    postJson<SessionResponse>(`${BASE}/sessions`, { titre, promotionId }),
  sessionsDe: (promotionId: number) =>
    getJson<SessionItem[]>(`${BASE}/sessions?promotionId=${promotionId}`),
  sessionDetail: (id: number) => getJson<SessionDetail>(`${BASE}/sessions/${id}`),
  cloturerSession: (id: number) =>
    postJson<SessionDetail>(`${BASE}/sessions/${id}/cloturer`, {}),

  // Présence
  marquerPresence: (code: string, etudiantId: number) =>
    postJson<PresenceResult>(`${BASE}/presences`, { code, etudiantId }),
  presenceManuelle: (sessionId: number, etudiantId: number) =>
    postJson<PresenceResult>(
      `${BASE}/sessions/${sessionId}/presences-manuelles`,
      { etudiantId }
    ),

  // Exercices
  deposerExercice: (sessionId: number, etudiantId: number, lien: string) =>
    postJson<ExerciceResult>(`${BASE}/exercices`, { sessionId, etudiantId, lien }),

  // Relectures
  mesRelectures: (etudiantId: number) =>
    getJson<RelectureARendre[]>(`${BASE}/etudiants/${etudiantId}/relectures`),
  rendreRelecture: (relectureId: number, note: number, commentaire: string) =>
    fetch(`${BASE}/relectures/${relectureId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ note, commentaire }),
    }).then((res) => {
      if (!res.ok) return traiterErreur(res)
      return { relectureId, statut: "RENDUE" as const, note }
    }),

  // Vue étudiant
  mesExercices: (etudiantId: number) =>
    getJson<MonExercice[]>(`${BASE}/etudiants/${etudiantId}/exercices`),

  // Tableau de bord (contrat)
  dashboard: (promotionId: number) =>
    getJson<LigneTableau[]>(`${BASE}/tableau?promotionId=${promotionId}`),
}
