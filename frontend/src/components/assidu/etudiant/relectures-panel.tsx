"use client"

// Étudiant — Panneau « Relectures » (rôle relecteur) (EF8, EF9, RG4, RG8, RG9).
// L'étudiant voit les relectures qu'on lui a assignées.
//  - Pour chaque relecture EN_ATTENTE : un formulaire note (0–20 entier, RG8) + commentaire.
//  - Une relecture RENDUE est définitive (RG9) : affichée en lecture seule.
//  - L'auto-relecture est impossible (EF9/RG4) — garantie côté assignation, vérifiée au rendu.
// Consomme GET /api/relectures?etudiantId= et POST /api/relectures/{id} du backend Spring.

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  Lock,
  Inbox,
  MessageSquare,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

import { api, type ApiErreur, type RelectureARendre } from "@/lib/api-client"
import {
  SectionTitre,
  EmptyState,
  ChargementBloc,
  ErreurBloc,
  StatutRelectureBadge,
  formatDateCourt,
} from "../shared"

export function EtudiantRelecturesPanel({
  etudiantId,
  etudiantNom,
}: {
  etudiantId: number
  etudiantNom: string
}) {
  const [aRendre, setARendre] = useState<RelectureARendre | null>(null)

  const q = useQuery({
    queryKey: ["mes-relectures", etudiantId],
    queryFn: () => api.mesRelectures(etudiantId),
    enabled: !!etudiantId,
    refetchInterval: 20000,
  })

  if (!etudiantId) {
    return (
      <EmptyState
        icon={<ClipboardCheck className="h-8 w-8" />}
        titre="Indiquez qui vous êtes"
        description="Sélectionnez votre promotion puis votre nom en haut de la page pour voir les exercices à relire."
      />
    )
  }

  const enAttente = (q.data ?? []).filter((r) => r.statut === "EN_ATTENTE")
  const rendues = (q.data ?? []).filter((r) => r.statut === "RENDUE")

  return (
    <div className="space-y-6">
      <SectionTitre
        icon={<ClipboardCheck className="h-5 w-5" />}
        titre="Mes relectures"
        description={`${etudiantNom} — relectures que le système vous a assignées (RG6). Une relecture rendue est définitive (RG9).`}
      />

      {q.isLoading ? (
        <ChargementBloc />
      ) : q.isError ? (
        <ErreurBloc message={(q.error as unknown as ApiErreur)?.message ?? "Erreur de chargement."} />
      ) : q.data && q.data.length > 0 ? (
        <>
          {enAttente.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                À rendre
                <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">
                  {enAttente.length}
                </Badge>
              </h3>
              <ScrollArea className="max-h-[50vh]">
                <ul className="space-y-3">
                  {enAttente.map((r) => (
                    <li key={r.id} className="rounded-xl border bg-card p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{r.exercice.session.titre}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Auteur : <strong>{r.exercice.auteurNom}</strong> · assigné le{" "}
                            {formatDateCourt(r.exercice.deposeAt ?? "")}
                          </p>
                          <a
                            href={r.exercice.lien}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline mt-2 break-all"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Ouvrir l'exercice à relire
                          </a>
                        </div>
                        <Button onClick={() => setARendre(r)}>
                          <ClipboardCheck className="h-4 w-4" />
                          Noter et commenter
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          )}

          {rendues.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Déjà rendues (définitives — RG9)
              </h3>
              <ScrollArea className="max-h-[40vh]">
                <ul className="space-y-3">
                  {rendues.map((r) => (
                    <li key={r.id} className="rounded-xl border bg-muted/20 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{r.exercice.session.titre}</p>
                          <p className="text-xs text-muted-foreground">
                            Auteur : {r.exercice.auteurNom}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-lg font-bold ${
                              (r.note ?? 0) >= 10 ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {r.note}/20
                          </span>
                          <StatutRelectureBadge statut={r.statut} />
                        </div>
                      </div>
                      {r.commentaire && (
                        <div className="mt-2 rounded-md bg-background p-2 text-sm">
                          <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            Votre commentaire
                          </p>
                          <p className="whitespace-pre-wrap">{r.commentaire}</p>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={<Inbox className="h-8 w-8" />}
          titre="Aucune relecture assignée"
          description="Dès qu'un pair déposera un exercice et que vous êtes présent à la session, le système peut vous l'assigner au hasard (RG6)."
        />
      )}

      {aRendre && (
        <RendreRelectureDialog
          relecture={aRendre}
          onClose={() => setARendre(null)}
        />
      )}
    </div>
  )
}

function RendreRelectureDialog({
  relecture,
  onClose,
}: {
  relecture: RelectureARendre
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [note, setNote] = useState("")
  const [commentaire, setCommentaire] = useState("")

  const rendre = useMutation({
    mutationFn: () =>
      api.rendreRelecture(relecture.id, Number(note), commentaire.trim()),
    onSuccess: () => {
      toast.success("Relecture rendue", {
        description: "Elle est définitive et ne peut plus être modifiée (RG9).",
      })
      qc.invalidateQueries({ queryKey: ["mes-relectures"] })
      onClose()
    },
    onError: (e: ApiErreur) => {
      toast.error("Rendu impossible", { description: e.message })
    },
  })

  const noteNum = Number(note)
  const noteValide =
    note !== "" && Number.isInteger(noteNum) && noteNum >= 0 && noteNum <= 20

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Noter cet exercice
          </DialogTitle>
          <DialogDescription>
            Session « {relecture.exercice.session.titre} » — auteur :{" "}
            {relecture.exercice.auteurNom}. Une fois rendue, la note est
            définitive (RG9).
          </DialogDescription>
        </DialogHeader>

        <a
          href={relecture.exercice.lien}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-sm text-emerald-700 hover:underline break-all bg-muted/40 rounded-md px-3 py-2"
        >
          <ExternalLink className="h-4 w-4" />
          Ouvrir l'exercice
        </a>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="note">
              Note <span className="text-muted-foreground">(entier 0–20, RG8)</span>
            </Label>
            <Input
              id="note"
              type="number"
              min={0}
              max={20}
              step={1}
              inputMode="numeric"
              placeholder="15"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-28 text-lg font-semibold"
            />
            {!noteValide && note !== "" && (
              <p className="text-xs text-rose-600">
                La note doit être un entier entre 0 et 20 inclus.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="commentaire">Commentaire</Label>
            <Textarea
              id="commentaire"
              placeholder="Justifiez la note : points forts, axes d'amélioration…"
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={4}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {commentaire.length}/2000
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={() => rendre.mutate()}
            disabled={!noteValide || !commentaire.trim() || rendre.isPending}
          >
            <CheckCircle2 className="h-4 w-4" />
            Rendre la relecture
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
