"use client"

// Formateur — Panneau « Sessions ».
// - Ouvrir une session (EF1) : titre + promotion → code + expiration.
// - Lister les sessions de la promotion.
// - Détail d'une session : présences (avec source), exercices, présence
//   manuelle (EF11, RG13), clôture (RG2).
// Données servies par le backend Spring (SessionResponse, SessionDetail...).

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  CalendarPlus,
  Users,
  ClipboardList,
  Lock,
  Plus,
  RefreshCw,
  Copy,
  Check,
  X,
  ExternalLink,
} from "lucide-react"

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

import { api, type ApiErreur } from "@/lib/api-client"
import {
  SectionTitre,
  EmptyState,
  ChargementBloc,
  ErreurBloc,
  CodeActifBadge,
  StatutPresenceBadge,
  StatutExerciceBadge,
  formatDateTime,
} from "../shared"

export function FormateurSessionsPanel({ promotionId }: { promotionId: number }) {
  const qc = useQueryClient()
  const [titre, setTitre] = useState("")
  const [sessionSelectionnee, setSessionSelectionnee] = useState<number | null>(null)

  const sessions = useQuery({
    queryKey: ["sessions", promotionId],
    queryFn: () => api.sessionsDe(promotionId),
    enabled: !!promotionId,
  })

  const ouvrir = useMutation({
    mutationFn: () => api.ouvrirSession(titre.trim(), promotionId),
    onSuccess: (s) => {
      toast.success("Session ouverte", {
        description: `Code de présence : ${s.code} (valide 15 min)`,
      })
      setTitre("")
      qc.invalidateQueries({ queryKey: ["sessions", promotionId] })
    },
    onError: (e: ApiErreur) => {
      toast.error("Ouverture impossible", { description: e.message })
    },
  })

  if (!promotionId) {
    return (
      <EmptyState
        icon={<Users className="h-8 w-8" />}
        titre="Sélectionnez une promotion"
        description="Choisissez une promotion en haut de la page pour gérer ses sessions."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Ouverture d'une session */}
      <section className="rounded-xl border bg-card p-4 sm:p-6">
        <SectionTitre
          icon={<CalendarPlus className="h-5 w-5" />}
          titre="Ouvrir une session de cours"
          description="Le code de présence généré est valable 15 minutes (RG1). Communiquez-le oralement en session."
        />
        <form
          className="flex flex-col sm:flex-row gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (!titre.trim()) return
            ouvrir.mutate()
          }}
        >
          <div className="flex-1">
            <Label htmlFor="titre" className="sr-only">
              Titre de la session
            </Label>
            <Input
              id="titre"
              placeholder="Ex. Cours Spring Boot — Couche service"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              maxLength={200}
              disabled={ouvrir.isPending}
            />
          </div>
          <Button type="submit" disabled={ouvrir.isPending || !titre.trim()}>
            <Plus className="h-4 w-4" />
            Ouvrir la session
          </Button>
        </form>
      </section>

      {/* Liste des sessions */}
      <section className="rounded-xl border bg-card">
        <div className="flex items-center justify-between p-4 sm:p-6 pb-3">
          <SectionTitre
            icon={<ClipboardList className="h-5 w-5" />}
            titre="Sessions de la promotion"
            description="Cliquez sur une session pour consulter présences, exercices et ajouter une présence manuelle."
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => sessions.refetch()}
            disabled={sessions.isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${sessions.isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <Separator />
        {sessions.isLoading ? (
          <ChargementBloc />
        ) : sessions.isError ? (
          <div className="p-4">
            <ErreurBloc
              message={(sessions.error as unknown as ApiErreur)?.message ?? "Erreur de chargement."}
            />
          </div>
        ) : sessions.data && sessions.data.length > 0 ? (
          <ul className="divide-y">
            {sessions.data.map((s) => (
              <li key={s.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setSessionSelectionnee(s.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      setSessionSelectionnee(s.id)
                    }
                  }}
                  className="w-full text-left p-4 sm:p-5 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{s.titre}</span>
                      <CodeActifBadge
                        codeActif={estCodeActif(s)}
                        cloturee={s.statut === "CLOTUREE"}
                        expireLe={s.expirationAt}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ouverte le {formatDateTime(s.ouvertureAt)} · {s.nbPresences} présence(s) ·{" "}
                      {s.nbExercices} exercice(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <CodeBloc code={s.code} actif={estCodeActif(s)} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<ClipboardList className="h-8 w-8" />}
            titre="Aucune session pour l'instant"
            description="Ouvrez votre première session ci-dessus pour générer un code de présence."
          />
        )}
      </section>

      {/* Détail d'une session */}
      {sessionSelectionnee && (
        <SessionDetailSheet
          sessionId={sessionSelectionnee}
          promotionId={promotionId}
          onClose={() => setSessionSelectionnee(null)}
        />
      )}
    </div>
  )
}

/** Un code est actif tant que la session est ouverte et que l'expiration n'est pas passée. */
function estCodeActif(s: { statut: string; expirationAt: string }): boolean {
  return s.statut === "OUVERTE" && new Date(s.expirationAt).getTime() > Date.now()
}

function CodeBloc({ code, actif }: { code: string; actif: boolean }) {
  const [copie, setCopie] = useState(false)
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        navigator.clipboard?.writeText(code)
        setCopie(true)
        setTimeout(() => setCopie(false), 1500)
      }}
      className={`font-mono text-base font-bold tracking-widest px-3 py-1.5 rounded-md border ${
        actif
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : "bg-slate-50 border-slate-200 text-slate-500"
      }`}
      title="Copier le code"
    >
      {code} {copie ? <Check className="inline h-3 w-3 ml-1" /> : <Copy className="inline h-3 w-3 ml-1" />}
    </button>
  )
}

function SessionDetailSheet({
  sessionId,
  promotionId,
  onClose,
}: {
  sessionId: number
  promotionId: number
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [dialogManuelle, setDialogManuelle] = useState(false)

  const detail = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => api.sessionDetail(sessionId),
    refetchInterval: 15000,
  })

  const cloturer = useMutation({
    mutationFn: () => api.cloturerSession(sessionId),
    onSuccess: () => {
      toast.success("Session clôturée", {
        description: "Plus aucune présence ne peut être enregistrée.",
      })
      qc.invalidateQueries({ queryKey: ["session", sessionId] })
      qc.invalidateQueries({ queryKey: ["sessions", promotionId] })
    },
    onError: (e: ApiErreur) => toast.error("Clôture impossible", { description: e.message }),
  })

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="p-4 sm:p-6 pb-3 border-b">
          <SheetTitle className="flex items-center gap-2 flex-wrap">
            <span className="truncate">{detail.data?.titre ?? "Session"}</span>
            {detail.data && (
              <CodeActifBadge
                codeActif={estCodeActif(detail.data)}
                cloturee={detail.data.statut === "CLOTUREE"}
                expireLe={detail.data.expirationAt}
              />
            )}
          </SheetTitle>
          <SheetDescription>
            {detail.data && (
              <>
                Promotion {detail.data.promotion.nom} · Ouverte le{" "}
                {formatDateTime(detail.data.ouvertureAt)}
              </>
            )}
          </SheetDescription>
        </SheetHeader>

        {detail.isLoading ? (
          <ChargementBloc />
        ) : detail.isError ? (
          <div className="p-4">
            <ErreurBloc
              message={(detail.error as unknown as ApiErreur)?.message ?? "Erreur de chargement."}
            />
          </div>
        ) : detail.data ? (
          <ScrollArea className="flex-1">
            <div className="p-4 sm:p-6 space-y-6">
              {/* Code de présence */}
              <div className="rounded-lg border bg-muted/30 p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Code de présence
                  </p>
                  <p className="font-mono text-2xl font-bold tracking-widest text-emerald-700 mt-1">
                    {detail.data.code}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Expire le {formatDateTime(detail.data.expirationAt)} (RG1)
                  </p>
                </div>
                {detail.data.statut === "OUVERTE" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => cloturer.mutate()}
                    disabled={cloturer.isPending}
                  >
                    <Lock className="h-4 w-4" />
                    Clôturer
                  </Button>
                )}
              </div>

              {/* Présences */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Présences ({detail.data.presences.length})
                  </h3>
                  {detail.data.statut === "OUVERTE" && (
                    <Button size="sm" variant="outline" onClick={() => setDialogManuelle(true)}>
                      <Plus className="h-4 w-4" />
                      Présence manuelle
                    </Button>
                  )}
                </div>
                {detail.data.presences.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
                    Aucune présence enregistrée pour l'instant.
                  </p>
                ) : (
                  <ul className="border rounded-md divide-y">
                    {detail.data.presences.map((p) => (
                      <li key={p.id} className="flex items-center justify-between p-3 text-sm">
                        <div>
                          <p className="font-medium">{p.etudiant.nom}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(p.marqueeAt)}
                          </p>
                        </div>
                        <StatutPresenceBadge source={p.source} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Exercices déposés */}
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-2">
                  <ClipboardList className="h-4 w-4" />
                  Exercices déposés ({detail.data.exercices.length})
                </h3>
                {detail.data.exercices.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
                    Aucun exercice déposé pour l'instant.
                  </p>
                ) : (
                  <ul className="border rounded-md divide-y">
                    {detail.data.exercices.map((e) => {
                      const rendues = e.relectures.filter((r) => r.statut === "RENDUE")
                      const note =
                        rendues.length > 0
                          ? Math.round(
                              rendues.reduce((acc, r) => acc + (r.note ?? 0), 0) / rendues.length
                            )
                          : null
                      return (
                        <li key={e.id} className="p-3 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium truncate">{e.etudiant.nom}</p>
                              <a
                                href={e.lien}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-emerald-700 hover:underline inline-flex items-center gap-1 mt-0.5"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Voir l'exercice
                              </a>
                            </div>
                            <StatutExerciceBadge statut={e.statut} />
                          </div>
                          {note !== null && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Note moyenne reçue : <span className="font-semibold">{note}/20</span>
                            </p>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>
          </ScrollArea>
        ) : null}

        {dialogManuelle && detail.data && (
          <PresenceManuelleDialog
            sessionId={detail.data.id}
            promotionId={promotionId}
            onClose={() => setDialogManuelle(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function PresenceManuelleDialog({
  sessionId,
  promotionId,
  onClose,
}: {
  sessionId: number
  promotionId: number
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [etudiantId, setEtudiantId] = useState<number | null>(null)

  const etudiants = useQuery({
    queryKey: ["etudiants", promotionId],
    queryFn: () => api.etudiantsDe(promotionId),
  })

  const ajouter = useMutation({
    mutationFn: () => api.presenceManuelle(sessionId, etudiantId!),
    onSuccess: () => {
      toast.success("Présence ajoutée", {
        description: "Marquée avec la source FORMATEUR (RG13).",
      })
      qc.invalidateQueries({ queryKey: ["session", sessionId] })
      qc.invalidateQueries({ queryKey: ["sessions", promotionId] })
      onClose()
    },
    onError: (e: ApiErreur) => toast.error("Ajout impossible", { description: e.message }),
  })

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter une présence manuelle</DialogTitle>
          <DialogDescription>
            À utiliser en cas de souci technique d'un étudiant. La présence sera
            marquée avec la source « FORMATEUR » (EF11, RG13).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Label htmlFor="etu">Étudiant</Label>
          <Select
            value={etudiantId ? String(etudiantId) : undefined}
            onValueChange={(v) => setEtudiantId(Number(v))}
          >
            <SelectTrigger id="etu">
              <SelectValue placeholder="Choisir un étudiant…" />
            </SelectTrigger>
            <SelectContent>
              {(etudiants.data ?? []).map((e) => (
                <SelectItem key={e.id} value={String(e.id)}>
                  {e.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4" />
            Annuler
          </Button>
          <Button
            onClick={() => ajouter.mutate()}
            disabled={!etudiantId || ajouter.isPending}
          >
            Marquer présent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
