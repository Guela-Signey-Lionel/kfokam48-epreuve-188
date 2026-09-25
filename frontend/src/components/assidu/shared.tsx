"use client"

// Assidu — Composants UI partagés : badges de statut, états vides, utilitaires.

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// ---------- Formatage ----------

export function formatDateCourt(iso: string | Date | null): string {
  if (!iso) return "—"
  const d = typeof iso === "string" ? new Date(iso) : iso
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function formatHeure(iso: string | Date | null): string {
  if (!iso) return "—"
  const d = typeof iso === "string" ? new Date(iso) : iso
  return d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatDateTime(iso: string | Date | null): string {
  if (!iso) return "—"
  return `${formatDateCourt(iso)} à ${formatHeure(iso)}`
}

/** Temps relatif court : « dans 3 min », « il y a 5 min ». */
export function relatif(iso: string | Date | null): string {
  if (!iso) return "—"
  const d = typeof iso === "string" ? new Date(iso) : iso
  const diff = d.getTime() - Date.now()
  const absMin = Math.round(Math.abs(diff) / 60000)
  if (absMin === 0) return "maintenant"
  if (diff > 0) {
    if (absMin < 60) return `dans ${absMin} min`
    return `dans ${Math.round(absMin / 60)} h`
  }
  if (absMin < 60) return `il y a ${absMin} min`
  return `il y a ${Math.round(absMin / 60)} h`
}

// ---------- Badges de statut ----------

export function StatutPresenceBadge({ source }: { source: string }) {
  if (source === "FORMATEUR") {
    return (
      <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">
        Formateur
      </Badge>
    )
  }
  return (
    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">
      Étudiant
    </Badge>
  )
}

export function StatutExerciceBadge({ statut }: { statut: string }) {
  switch (statut) {
    case "DEPOSE":
      return (
        <Badge className="bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100">
          Déposé
        </Badge>
      )
    case "EN_ATTENTE_RELECTURE":
      return (
        <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">
          En attente de relecture
        </Badge>
      )
    case "RELU":
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">
          Relu
        </Badge>
      )
    default:
      return <Badge variant="outline">{statut}</Badge>
  }
}

export function StatutRelectureBadge({ statut }: { statut: string }) {
  if (statut === "RENDUE") {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">
        Rendue
      </Badge>
    )
  }
  return (
    <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">
      À rendre
    </Badge>
  )
}

export function CodeActifBadge({
  codeActif,
  cloturee,
  expireLe,
}: {
  codeActif: boolean
  cloturee: boolean
  expireLe: string | null
}) {
  if (cloturee) {
    return (
      <Badge className="bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-100">
        Clôturée
      </Badge>
    )
  }
  if (codeActif) {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">
        Code actif · expire {relatif(expireLe)}
      </Badge>
    )
  }
  return (
    <Badge className="bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100">
      Code expiré
    </Badge>
  )
}

// ---------- États vides et erreurs ----------

export function EmptyState({
  icon,
  titre,
  description,
  action,
}: {
  icon?: React.ReactNode
  titre: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      {icon && (
        <div className="mb-3 text-muted-foreground/60">{icon}</div>
      )}
      <p className="font-medium text-foreground">{titre}</p>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 max-w-md">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErreurBloc({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
      {message}
    </div>
  )
}

export function ChargementBloc({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-8 text-sm text-muted-foreground gap-2">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
      {label}
    </div>
  )
}

// ---------- Titre de section ----------

export function SectionTitre({
  titre,
  description,
  icon,
  action,
}: {
  titre: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="mt-0.5 text-emerald-600 shrink-0">{icon}</div>
        )}
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{titre}</h2>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  )
}

// ---------- Carte statistique ----------

export function StatCard({
  label,
  value,
  hint,
  accent = "emerald",
}: {
  label: string
  value: React.ReactNode
  hint?: string
  accent?: "emerald" | "amber" | "rose" | "slate"
}) {
  const accents: Record<string, string> = {
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    rose: "text-rose-600",
    slate: "text-slate-600",
  }
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className={cn("text-2xl font-bold mt-1", accents[accent])}>{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  )
}
