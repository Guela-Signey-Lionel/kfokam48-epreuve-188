"use client"

// Étudiant — Panneau « Mes exercices » (EF10, RG7).
// L'étudiant voit les notes et commentaires reçus sur ses exercices,
// SANS JAMAIS l'identité des relecteurs (garantie côté API comme côté UI).

import { useQuery } from "@tanstack/react-query"
import {
  GraduationCap,
  FileText,
  MessageSquare,
  ExternalLink,
  Lock,
  Inbox,
} from "lucide-react"

import { ScrollArea } from "@/components/ui/scroll-area"

import { api, type ApiErreur, type MonExercice } from "@/lib/api-client"
import {
  SectionTitre,
  EmptyState,
  ChargementBloc,
  ErreurBloc,
  StatutExerciceBadge,
  formatDateCourt,
} from "../shared"

export function EtudiantMesExercicesPanel({
  etudiantId,
  etudiantNom,
}: {
  etudiantId: number
  etudiantNom: string
}) {
  const q = useQuery({
    queryKey: ["mes-exercices", etudiantId],
    queryFn: () => api.mesExercices(etudiantId),
    enabled: !!etudiantId,
    refetchInterval: 20000,
  })

  if (!etudiantId) {
    return (
      <EmptyState
        icon={<GraduationCap className="h-8 w-8" />}
        titre="Indiquez qui vous êtes"
        description="Sélectionnez votre promotion puis votre nom en haut de la page pour consulter vos exercices et vos notes."
      />
    )
  }

  /** Note visible : moyenne des relectures rendues ; note d'un seul relecteur = provisoire (RG16). */
  function noteAffichee(e: MonExercice): { note: number; provisoire: boolean } | null {
    const rendues = e.relectures.filter((r) => r.statut === "RENDUE" && r.note !== null)
    if (rendues.length === 0) return null
    const moyenne =
      rendues.reduce((acc, r) => acc + (r.note ?? 0), 0) / rendues.length
    return {
      note: Math.round(moyenne * 10) / 10,
      provisoire: rendues.length < 2,
    }
  }

  return (
    <div className="space-y-6">
      <SectionTitre
        icon={<GraduationCap className="h-5 w-5" />}
        titre="Mes exercices et mes notes"
        description={`${etudiantNom} — vos notes et commentaires de relecture. L'identité des relecteurs n'est jamais affichée (RG7).`}
      />

      {/* Bandeau de confidentialité */}
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 flex items-start gap-2 text-sm text-emerald-800">
        <Lock className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          Conformément à la règle <strong>RG7</strong>, vous voyez les notes et
          commentaires, mais <strong>jamais l'identité des relecteurs</strong>.
        </p>
      </div>

      {q.isLoading ? (
        <ChargementBloc />
      ) : q.isError ? (
        <ErreurBloc message={(q.error as unknown as ApiErreur)?.message ?? "Erreur de chargement."} />
      ) : q.data && q.data.length > 0 ? (
        <ScrollArea className="max-h-[70vh]">
          <ul className="space-y-3">
            {q.data.map((e) => {
              const enAttente = e.relectures.some((r) => r.statut === "EN_ATTENTE")
              const note = noteAffichee(e)
              const commentaires = e.relectures.filter(
                (r) => r.statut === "RENDUE" && r.commentaire
              )
              return (
                <li key={e.id} className="rounded-xl border bg-card p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold">{e.session.titre}</p>
                      <p className="text-xs text-muted-foreground">
                        Session du {formatDateCourt(e.session.ouvertureAt ?? e.deposeAt)} · déposé le{" "}
                        {formatDateCourt(e.deposeAt)}
                      </p>
                      <a
                        href={e.lien}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline mt-1 break-all"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {e.lien}
                      </a>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatutExerciceBadge statut={e.statut} />
                      {note && (
                        <div className="text-center">
                          <div
                            className={`text-3xl font-bold ${
                              note.note >= 10 ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {note.note}
                            <span className="text-base text-muted-foreground">/20</span>
                          </div>
                          {note.provisoire && (
                            <span className="text-[11px] font-medium text-amber-600">
                              provisoire — en attente du 2e relecteur
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Commentaires des relecteurs (sans identité) */}
                  {commentaires.map((r, i) => (
                    <div key={i} className="mt-3 rounded-md bg-muted/40 p-3">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                        <MessageSquare className="h-3 w-3" />
                        Commentaire du relecteur {commentaires.length > 1 ? i + 1 : ""}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{r.commentaire}</p>
                    </div>
                  ))}

                  {enAttente && !note?.provisoire && (
                    <div className="mt-3 rounded-md bg-amber-50 border border-amber-200 p-3">
                      <p className="text-sm text-amber-800 flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        Relecture en cours. La note définitive sera la moyenne des deux relecteurs
                        (RG16).
                      </p>
                    </div>
                  )}

                  {e.statut === "DEPOSE" && (
                    <div className="mt-3 rounded-md bg-slate-50 border border-slate-200 p-3">
                      <p className="text-sm text-slate-600">
                        En attente de relecteurs (RG15). Dès que des pairs présents
                        seront disponibles, l'exercice passera en relecture.
                      </p>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </ScrollArea>
      ) : (
        <EmptyState
          icon={<Inbox className="h-8 w-8" />}
          titre="Aucun exercice déposé"
          description="Déposez votre premier exercice depuis l'onglet « Dépôt »."
        />
      )}
    </div>
  )
}
