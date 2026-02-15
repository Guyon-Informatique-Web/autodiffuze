// Schemas de validation Zod pour les routes IA
import { z } from "zod"

// Cles de plateforme valides pour l'adaptation de contenu
const platformKeyValues = [
  "FACEBOOK",
  "INSTAGRAM",
  "LINKEDIN",
  "X",
  "TIKTOK",
] as const

// Schema pour la generation de contenu IA
export const generateContentSchema = z.object({
  clientId: z.string().min(1, "L'identifiant du client est obligatoire"),
  prompt: z
    .string()
    .min(10, "Le prompt doit contenir au moins 10 caracteres")
    .max(1000, "Le prompt ne doit pas depasser 1000 caracteres"),
})

// Schema pour l'adaptation de contenu a une plateforme
export const adaptContentSchema = z.object({
  baseContent: z
    .string()
    .min(1, "Le contenu de base est obligatoire"),
  platform: z.enum(platformKeyValues, {
    message: "Plateforme invalide",
  }),
  clientId: z.string().min(1, "L'identifiant du client est obligatoire"),
})

export type GenerateContentInput = z.infer<typeof generateContentSchema>
export type AdaptContentInput = z.infer<typeof adaptContentSchema>
