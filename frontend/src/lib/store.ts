// Assidu — État UI global (rôle courant, étudiant sélectionné, promotion active).
// Pas d'auth : l'étudiant se désigne lui-même (Q1). Le formateur est un acteur
// non authentifié (section 7). Cet état vit côté client uniquement.
// Les identifiants sont des number : ils proviennent du backend Spring (Long).
import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Role = "formateur" | "etudiant"

interface AssiduState {
  role: Role
  etudiantId: number | null
  promotionId: number | null
  setRole: (r: Role) => void
  setEtudiantId: (id: number | null) => void
  setPromotionId: (id: number | null) => void
  reset: () => void
}

export const useAssidu = create<AssiduState>()(
  persist(
    (set) => ({
      role: "formateur",
      etudiantId: null,
      promotionId: null,
      setRole: (role) => set({ role }),
      setEtudiantId: (etudiantId) => set({ etudiantId }),
      setPromotionId: (promotionId) => set({ promotionId }),
      reset: () =>
        set({
          role: "formateur",
          etudiantId: null,
          promotionId: null,
        }),
    }),
    { name: "assidu-ui", skipHydration: true }
  )
)
