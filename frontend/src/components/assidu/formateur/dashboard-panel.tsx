"use client"

// Formateur — Panneau « Tableau de bord » (EF5, RG14).
// Pour chaque étudiant de la promotion : présences, exercices déposés,
// moyenne des notes reçues (vide si aucune), relectures restant à rendre.
// Données servies par GET /api/tableau du backend Spring (contrat imposé).

import { useQuery } from "@tanstack/react-query"
import { BarChart3, Users, AlertCircle, GraduationCap } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"

import { api, type ApiErreur } from "@/lib/api-client"
import {
  SectionTitre,
  EmptyState,
  ChargementBloc,
  ErreurBloc,
} from "../shared"

export function FormateurDashboardPanel({ promotionId }: { promotionId: number }) {
  const tableau = useQuery({
    queryKey: ["tableau", promotionId],
    queryFn: () => api.dashboard(promotionId),
    enabled: !!promotionId,
    refetchInterval: 20000,
  })

  if (!promotionId) {
    return (
      <EmptyState
        icon={<Users className="h-8 w-8" />}
        titre="Sélectionnez une promotion"
        description="Choisissez une promotion en haut de la page pour afficher son tableau de bord."
      />
    )
  }

  if (tableau.isLoading) return <ChargementBloc label="Calcul du tableau de bord…" />
  if (tableau.isError) {
    const code = (tableau.error as unknown as ApiErreur)?.code
    const message = (tableau.error as unknown as ApiErreur)?.message ?? "Erreur de chargement."
    // EF13 : promotion inconnue → erreur explicite (404 PROMOTION_INCONNUE).
    return (
      <div className="space-y-3">
        <ErreurBloc message={message} />
        {code === "PROMOTION_INCONNUE" && (
          <p className="text-xs text-muted-foreground">
            (EF13) Une promotion inconnue renvoie une erreur explicite plutôt qu'un tableau vide.
          </p>
        )}
      </div>
    )
  }

  const lignes = tableau.data ?? []
  const nbRelecturesEnAttente = lignes.reduce((acc, l) => acc + l.relecturesEnAttente, 0)
  const moyennes = lignes
    .map((l) => l.moyenne)
    .filter((m): m is number => m !== null)
  const moyennePromo =
    moyennes.length > 0
      ? Math.round((moyennes.reduce((a, b) => a + b, 0) / moyennes.length) * 10) / 10
      : null

  return (
    <div className="space-y-6">
      <SectionTitre
        icon={<BarChart3 className="h-5 w-5" />}
        titre="Tableau de bord"
        description="Synthèse par étudiant. Les compteurs et la moyenne sont calculés côté API (RG14)."
      />

      {/* Synthèse globale */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Étudiants" value={lignes.length} accent="emerald" />
        <StatCard label="Moyenne promo" value={moyennePromo !== null ? `${moyennePromo}/20` : "—"} accent="amber" />
        <StatCard
          label="Relectures en attente"
          value={nbRelecturesEnAttente}
          accent="rose"
        />
      </div>

      {/* Tableau par étudiant */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Suivi par étudiant
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Présences · Exercices déposés · Moyenne des notes reçues · Relectures à rendre (RG14)
          </p>
        </div>
        {lignes.length === 0 ? (
          <EmptyState
            icon={<AlertCircle className="h-8 w-8" />}
            titre="Aucun étudiant dans cette promotion"
          />
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Étudiant</TableHead>
                  <TableHead className="text-center">Présences</TableHead>
                  <TableHead className="text-center">Exercices</TableHead>
                  <TableHead className="text-center">Moyenne</TableHead>
                  <TableHead className="text-center">À relire</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lignes.map((l) => (
                  <TableRow key={l.etudiantId}>
                    <TableCell>
                      <div className="font-medium">{l.nom}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold text-emerald-700">{l.presences}</span>
                    </TableCell>
                    <TableCell className="text-center">{l.exercicesDeposes}</TableCell>
                    <TableCell className="text-center">
                      {l.moyenne !== null ? (
                        <span
                          className={`font-semibold ${
                            l.moyenne >= 10 ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          {Math.round(l.moyenne * 10) / 10}/20
                          {l.moyenneProvisoire && (
                            <span
                              className="ml-1 align-middle text-[10px] font-normal text-muted-foreground"
                              title="Provisoire : des relectures sont encore en attente"
                            >
                              (provisoire)
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {l.relecturesEnAttente > 0 ? (
                        <span className="inline-flex items-center justify-center min-w-[1.75rem] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                          {l.relecturesEnAttente}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  accent = "emerald",
}: {
  label: string
  value: React.ReactNode
  accent?: "emerald" | "amber" | "rose"
}) {
  const accents: Record<string, string> = {
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    rose: "text-rose-600",
  }
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className={`text-2xl font-bold mt-1 ${accents[accent]}`}>{value}</p>
    </div>
  )
}
