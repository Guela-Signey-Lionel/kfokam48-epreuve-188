"use client"

// Étudiant — Panneau « Dépôt d'exercice » (EF5, EF6, RG12, RG15).
// L'étudiant choisit une session de sa promotion (non clôturée) et y dépose
// le lien de son exercice. Le lien peut être remplacé tant qu'aucun relecteur
// n'a été assigné (RG12). Consomme POST /api/exercices du backend Spring.

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Upload, Link2, Info, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"

import { api, type ApiErreur } from "@/lib/api-client"
import { SectionTitre, EmptyState, ChargementBloc, ErreurBloc } from "../shared"

export function EtudiantDepotPanel({
  etudiantId,
  etudiantNom,
  promotionId,
}: {
  etudiantId: number
  etudiantNom: string
  promotionId: number
}) {
  const qc = useQueryClient()
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [lien, setLien] = useState("")
  const [resultat, setResultat] = useState<{ statut: string } | null>(null)

  const sessions = useQuery({
    queryKey: ["sessions", promotionId],
    queryFn: () => api.sessionsDe(promotionId),
    enabled: !!promotionId,
  })

  // Exercices déjà déposés par l'étudiant, pour guider le remplacement.
  const mesExercices = useQuery({
    queryKey: ["mes-exercices", etudiantId],
    queryFn: () => api.mesExercices(etudiantId),
    enabled: !!etudiantId,
  })

  // Pré-remplit le lien avec un éventuel dépôt existant au moment du choix de
  // session (dans le handler, pas dans un effet — évite les rendus en cascade).
  const choisirSession = (id: number) => {
    setSessionId(id)
    const existant = mesExercices.data?.find((e) => e.session.id === id)
    setLien(existant?.lien ?? "")
    setResultat(null)
  }

  const deposer = useMutation({
    mutationFn: () => api.deposerExercice(sessionId!, etudiantId, lien.trim()),
    onSuccess: (r) => {
      setResultat({ statut: r.statut })
      toast.success("Exercice déposé", {
        description:
          r.statut === "EN_ATTENTE_RELECTURE"
            ? "Des relecteurs ont été assignés automatiquement."
            : "En attente de relecteurs disponibles.",
      })
      qc.invalidateQueries({ queryKey: ["mes-exercices", etudiantId] })
    },
    onError: (e: ApiErreur) => {
      toast.error("Dépôt impossible", { description: e.message })
    },
  })

  if (!etudiantId) {
    return (
      <EmptyState
        icon={<Upload className="h-8 w-8" />}
        titre="Indiquez qui vous êtes"
        description="Sélectionnez votre promotion puis votre nom en haut de la page pour déposer un exercice."
      />
    )
  }

  const sessionsDeposables = (sessions.data ?? []).filter((s) => s.statut === "OUVERTE")
  const exerciceExistant = mesExercices.data?.find((e) => e.session.id === sessionId)
  // RG12 : lien figé dès qu'un relecteur est assigné (au moins une relecture).
  const lienFige = (exerciceExistant?.relectures.length ?? 0) > 0

  return (
    <div className="space-y-6">
      <SectionTitre
        icon={<Upload className="h-5 w-5" />}
        titre="Déposer le lien de mon exercice"
        description={`Connecté en tant que ${etudiantNom}. Le dépôt reste possible tant que la session n'est pas clôturée (RG11).`}
      />

      <div className="rounded-xl border bg-card p-4 sm:p-6">
        {sessions.isLoading ? (
          <ChargementBloc />
        ) : sessions.isError ? (
          <ErreurBloc message={(sessions.error as unknown as ApiErreur)?.message ?? "Erreur de chargement."} />
        ) : sessionsDeposables.length === 0 ? (
          <EmptyState
            icon={<Info className="h-8 w-8" />}
            titre="Aucune session ouverte pour votre promotion"
            description="Le formateur doit ouvrir une session (et ne pas l'avoir clôturée) pour que vous puissiez y déposer un exercice."
          />
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              setResultat(null)
              if (!sessionId || !lien.trim()) return
              deposer.mutate()
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="session">Session</Label>
              <Select
                value={sessionId ? String(sessionId) : undefined}
                onValueChange={(v) => choisirSession(Number(v))}
              >
                <SelectTrigger id="session">
                  <SelectValue placeholder="Choisir une session…" />
                </SelectTrigger>
                <SelectContent>
                  {sessionsDeposables.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.titre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lien">Lien de l'exercice (URL https)</Label>
              <Input
                id="lien"
                type="url"
                inputMode="url"
                placeholder="https://github.com/mon-compte/mon-exercice"
                value={lien}
                onChange={(e) => setLien(e.target.value)}
                disabled={deposer.isPending || lienFige}
              />
              {lienFige && (
                <p className="text-xs text-amber-700 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Des relecteurs ont été assignés : le lien est figé (RG12). Vous ne pouvez plus le modifier.
                </p>
              )}
              {!lienFige && exerciceExistant && (
                <p className="text-xs text-muted-foreground">
                  Vous avez déjà déposé un lien pour cette session. Le remplacer mettra à jour le dépôt (EF6).
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={deposer.isPending || !sessionId || !lien.trim() || lienFige}
            >
              <Link2 className="h-4 w-4" />
              {exerciceExistant ? "Remplacer le lien" : "Déposer l'exercice"}
            </Button>
          </form>
        )}
      </div>

      {/* Résultat */}
      {resultat && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-sm text-emerald-900">
              <p className="font-semibold">
                {resultat.statut === "DEPOSE"
                  ? "Exercice déposé — en attente de relecteurs"
                  : "Exercice déposé et relecteurs assignés"}
              </p>
              <p className="mt-1 text-xs">
                Les relecteurs sont tirés au sort parmi les étudiants présents (RG6), jamais
                vous-même (RG4). Vous ne connaissez pas leur identité (RG7) — vous verrez les
                notes dans « Mes notes ».
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Exercices déjà déposés (rappel) */}
      {mesExercices.data && mesExercices.data.length > 0 && (
        <div className="rounded-xl border bg-card">
          <div className="p-4 sm:p-5 border-b">
            <h3 className="font-semibold">Mes dépôts récents</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pour remplacer un lien, sélectionnez la session ci-dessus (si non figé).
            </p>
          </div>
          <ScrollArea className="max-h-72">
            <ul className="divide-y">
              {mesExercices.data.map((e) => (
                <li key={e.id} className="p-3 text-sm">
                  <p className="font-medium">{e.session.titre}</p>
                  <a
                    href={e.lien}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-emerald-700 hover:underline break-all"
                  >
                    {e.lien}
                  </a>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
