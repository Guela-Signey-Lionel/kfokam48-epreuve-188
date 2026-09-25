"use client"

// Assidu — Coquille applicative.
// Header (rôle + sélection étudiant/promotion) + onglets contextuels + footer.
// Une seule route (`/`) — tout le périmètre est accessible par onglets.
// Toutes les données viennent du backend Spring via la couche api-client.

import { useQuery } from "@tanstack/react-query"
import {
  GraduationCap,
  ClipboardList,
  BarChart3,
  QrCode,
  Upload,
  Inbox,
  ClipboardCheck,
  Users,
  BookOpenCheck,
  Sun,
  Moon,
  Laptop,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect } from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

import { useAssidu } from "@/lib/store"
import { api } from "@/lib/api-client"

import { FormateurSessionsPanel } from "./formateur/sessions-panel"
import { FormateurDashboardPanel } from "./formateur/dashboard-panel"
import { EtudiantPresencePanel } from "./etudiant/presence-panel"
import { EtudiantDepotPanel } from "./etudiant/depot-panel"
import { EtudiantMesExercicesPanel } from "./etudiant/mes-exercices-panel"
import { EtudiantRelecturesPanel } from "./etudiant/relectures-panel"

export function AppShell() {
  const { role, setRole, promotionId, setPromotionId, etudiantId, setEtudiantId } =
    useAssidu()

  // Réhydrate manuellement le store persisté APRÈS le montage, pour éviter
  // tout mismatch d'hydratation (le serveur rend avec les valeurs par défaut,
  // puis le client recharge l'état depuis localStorage).
  useEffect(() => {
    void useAssidu.persist.rehydrate()
  }, [])

  const promotions = useQuery({
    queryKey: ["promotions"],
    queryFn: api.promotions,
  })

  // Étudiants de la promotion sélectionnée (pour le sélecteur étudiant).
  const etudiants = useQuery({
    queryKey: ["etudiants", promotionId],
    queryFn: () => api.etudiantsDe(promotionId!),
    enabled: !!promotionId,
  })

  // Si l'étudiant sélectionné n'appartient plus à la promo, on réinitialise.
  useEffect(() => {
    if (etudiantId && etudiants.data && !etudiants.data.find((e) => e.id === etudiantId)) {
      setEtudiantId(null)
    }
  }, [etudiantId, etudiants.data, setEtudiantId])

  const etudiantCourant = etudiants.data?.find((e) => e.id === etudiantId) ?? null
  const promoCourante = promotions.data?.find((p) => p.id === promotionId) ?? null

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      {/* ---------- Header ---------- */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4">
          {/* Ligne 1 : identité + thème */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
                <BookOpenCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight leading-none">
                  Assidu
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  Présence · Dépôt · Relecture par les pairs — KFOKAM48
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>

          {/* Ligne 2 : sélecteurs (rôle + promotion + étudiant) */}
          <div className="mt-3 flex flex-col sm:flex-row sm:items-end gap-3">
            {/* Rôle */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Rôle</Label>
              <div className="inline-flex rounded-lg border bg-card p-1">
                <RoleBouton
                  actif={role === "formateur"}
                  onClick={() => setRole("formateur")}
                  icon={<GraduationCap className="h-4 w-4" />}
                  label="Formateur"
                />
                <RoleBouton
                  actif={role === "etudiant"}
                  onClick={() => setRole("etudiant")}
                  icon={<Users className="h-4 w-4" />}
                  label="Étudiant"
                />
              </div>
            </div>

            {/* Promotion */}
            <div className="space-y-1.5 flex-1 min-w-0">
              <Label htmlFor="promo" className="text-xs text-muted-foreground">
                Promotion
              </Label>
              <Select
                key={promotionId ? "set" : "empty"}
                value={promotionId ? String(promotionId) : undefined}
                onValueChange={(v) => {
                  setPromotionId(Number(v))
                  setEtudiantId(null)
                }}
              >
                <SelectTrigger id="promo" className="w-full">
                  <SelectValue placeholder="Choisir une promotion…" />
                </SelectTrigger>
                <SelectContent>
                  {(promotions.data ?? []).map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nom} ({p.nbEtudiants} ét.)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Étudiant (uniquement en rôle étudiant) */}
            {role === "etudiant" && (
              <div className="space-y-1.5 flex-1 min-w-0">
                <Label htmlFor="etu" className="text-xs text-muted-foreground">
                  Vous êtes
                </Label>
                <Select
                  key={etudiantId ? "set" : "empty"}
                  value={etudiantId ? String(etudiantId) : undefined}
                  onValueChange={(v) => setEtudiantId(Number(v))}
                  disabled={!promotionId}
                >
                  <SelectTrigger id="etu" className="w-full">
                    <SelectValue
                      placeholder={promotionId ? "Choisir votre nom…" : "Promotion d'abord"}
                    />
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
            )}
          </div>
        </div>
      </header>

      {/* ---------- Contenu ---------- */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-5 sm:py-8">
        {role === "formateur" ? (
          <Tabs key="formateur" defaultValue="sessions" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="sessions" className="gap-1.5">
                <ClipboardList className="h-4 w-4" />
                <span className="hidden sm:inline">Sessions & présences</span>
                <span className="sm:hidden">Sessions</span>
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="gap-1.5">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Tableau de bord</span>
                <span className="sm:hidden">Dashboard</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="sessions" className="mt-0">
              <FormateurSessionsPanel promotionId={promotionId ?? 0} />
            </TabsContent>
            <TabsContent value="dashboard" className="mt-0">
              <FormateurDashboardPanel promotionId={promotionId ?? 0} />
            </TabsContent>
          </Tabs>
        ) : (
          <Tabs key="etudiant" defaultValue="presence" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6">
              <TabsTrigger value="presence" className="gap-1.5">
                <QrCode className="h-4 w-4" />
                <span className="hidden sm:inline">Présence</span>
              </TabsTrigger>
              <TabsTrigger value="depot" className="gap-1.5">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Dépôt</span>
              </TabsTrigger>
              <TabsTrigger value="mes-exercices" className="gap-1.5">
                <Inbox className="h-4 w-4" />
                <span className="hidden sm:inline">Mes notes</span>
                <span className="sm:hidden">Notes</span>
              </TabsTrigger>
              <TabsTrigger value="relectures" className="gap-1.5">
                <ClipboardCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Relectures</span>
                <span className="sm:hidden">Relire</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="presence" className="mt-0">
              <EtudiantPresencePanel
                etudiantId={etudiantId ?? 0}
                etudiantNom={etudiantCourant?.nom ?? ""}
              />
            </TabsContent>
            <TabsContent value="depot" className="mt-0">
              <EtudiantDepotPanel
                etudiantId={etudiantId ?? 0}
                etudiantNom={etudiantCourant?.nom ?? ""}
                promotionId={promotionId ?? 0}
              />
            </TabsContent>
            <TabsContent value="mes-exercices" className="mt-0">
              <EtudiantMesExercicesPanel
                etudiantId={etudiantId ?? 0}
                etudiantNom={etudiantCourant?.nom ?? ""}
              />
            </TabsContent>
            <TabsContent value="relectures" className="mt-0">
              <EtudiantRelecturesPanel
                etudiantId={etudiantId ?? 0}
                etudiantNom={etudiantCourant?.nom ?? ""}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* ---------- Footer ---------- */}
      <footer className="mt-auto border-t bg-background">
        <div className="max-w-6xl mx-auto px-4 py-4 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p>
            <strong className="text-foreground">Assidu</strong> · Présence, dépôt et
            relecture par les pairs — formation KFOKAM48.
          </p>
          <p>
            Auteur : GUELA Signey Lionel (matricule 188) · v1.0 ·{" "}
            {promoCourante ? `Promo : ${promoCourante.nom}` : "Aucune promotion sélectionnée"}
          </p>
        </div>
      </footer>
    </div>
  )
}

function RoleBouton({
  actif,
  onClick,
  icon,
  label,
}: {
  actif: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
        actif
          ? "bg-emerald-600 text-white shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const cycle = () => {
    if (theme === "light") setTheme("dark")
    else if (theme === "dark") setTheme("system")
    else setTheme("light")
  }

  const icone =
    theme === "dark" ? (
      <Moon className="h-4 w-4" />
    ) : theme === "system" ? (
      <Laptop className="h-4 w-4" />
    ) : (
      <Sun className="h-4 w-4" />
    )

  return (
    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={cycle} title="Changer de thème">
      {icone}
    </Button>
  )
}
