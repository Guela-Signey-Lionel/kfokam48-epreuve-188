"use client"

// Étudiant — Panneau « Présence » (EF2, EF3, EF4, RG1, RG2, RG3).
// L'étudiant saisit le code communiqué en session. Selon le cas :
//  - succès : présence enregistrée (source ÉTUDIANT) ;
//  - code inconnu / expiré / déjà présent / bloqué : message métier clair ;
//  - 5 échecs consécutifs : blocage 2 minutes (RG3).
// Consomme POST /api/presences du backend Spring (contrat imposé).

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { QrCode, CheckCircle2, AlertTriangle, Timer, KeyRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { api, type ApiErreur } from "@/lib/api-client"
import { SectionTitre, EmptyState } from "../shared"

export function EtudiantPresencePanel({
  etudiantId,
  etudiantNom,
}: {
  etudiantId: number
  etudiantNom: string
}) {
  const [code, setCode] = useState("")
  const [resultat, setResultat] = useState<
    { ok: true } | { ok: false; code: string; message: string } | null
  >(null)

  const marquer = useMutation({
    mutationFn: () => api.marquerPresence(code.trim().toUpperCase(), etudiantId),
    onSuccess: () => {
      setResultat({ ok: true })
      setCode("")
      toast.success("Présence enregistrée")
    },
    onError: (e: ApiErreur) => {
      setResultat({ ok: false, code: e.code, message: e.message })
      if (e.code === "TROP_DE_TENTATIVES") {
        toast.error("Bloqué temporairement", { description: e.message })
      } else {
        toast.error("Présence refusée", { description: e.message })
      }
    },
  })

  if (!etudiantId) {
    return (
      <EmptyState
        icon={<KeyRound className="h-8 w-8" />}
        titre="Indiquez qui vous êtes"
        description="Sélectionnez votre promotion puis votre nom en haut de la page pour saisir un code de présence."
      />
    )
  }

  return (
    <div className="space-y-6">
      <SectionTitre
        icon={<QrCode className="h-5 w-5" />}
        titre="Saisir mon code de présence"
        description={`Connecté en tant que ${etudiantNom}. Le code est valable 15 min après l'ouverture de la session (RG1).`}
      />

      <div className="rounded-xl border bg-card p-4 sm:p-6">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            setResultat(null)
            if (!code.trim()) return
            marquer.mutate()
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="code">Code de présence</Label>
            <Input
              id="code"
              autoFocus
              autoComplete="off"
              spellCheck={false}
              placeholder="Ex. AB3K7M"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="text-center text-2xl font-mono font-bold tracking-[0.4em] h-14"
              disabled={marquer.isPending}
            />
            <p className="text-xs text-muted-foreground">
              6 caractères, communiqué oralement par le formateur en session.
            </p>
          </div>
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={marquer.isPending || !code.trim()}
          >
            Marquer ma présence
          </Button>
        </form>
      </div>

      {/* Résultat */}
      {resultat && (
        <div
          className={`rounded-xl border p-4 sm:p-5 ${
            resultat.ok
              ? "border-emerald-200 bg-emerald-50"
              : "border-rose-200 bg-rose-50"
          }`}
        >
          {resultat.ok ? (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-900">Présence enregistrée</p>
                <p className="text-sm text-emerald-800 mt-1">
                  Votre présence est visible par le formateur avec la source « ÉTUDIANT ».
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-900">
                  {resultat.code === "TROP_DE_TENTATIVES"
                    ? "Bloqué temporairement"
                    : resultat.code === "CODE_INCONNU"
                    ? "Code inconnu"
                    : resultat.code === "CODE_EXPIRE"
                    ? "Code expiré"
                    : resultat.code === "DEJA_PRESENT"
                    ? "Déjà présent"
                    : "Présence refusée"}
                </p>
                <p className="text-sm text-rose-800 mt-1">{resultat.message}</p>
                {resultat.code === "TROP_DE_TENTATIVES" && (
                  <p className="text-xs text-rose-700 mt-2 flex items-center gap-1">
                    <Timer className="h-3 w-3" />
                    Règle RG3 : 5 codes erronés consécutifs → blocage 2 minutes.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rappel des règles */}
      <div className="rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground mb-1">Rappels</p>
        <p>• Un code expire 15 min après l'ouverture de la session (RG1).</p>
        <p>• Après 5 codes erronés consécutifs, vous êtes bloqué 2 minutes (RG3).</p>
        <p>• Une fois présent enregistré, vous ne pouvez pas le saisir à nouveau (EF3).</p>
      </div>
    </div>
  )
}
