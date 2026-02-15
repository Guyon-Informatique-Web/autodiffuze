// Schemas de validation Zod pour les clients
import { z } from "zod"

// Valeurs possibles pour le secteur d'activite
export const INDUSTRIES = [
  "Commerce",
  "Restauration",
  "Sante",
  "Tech",
  "Services",
  "Artisanat",
  "Immobilier",
  "Education",
  "Sport",
  "Mode",
  "Beaute",
  "Autre",
] as const

// Valeurs possibles pour le ton de communication
export const TONES = [
  "Professionnel",
  "Decontracte",
  "Inspirant",
  "Humoristique",
  "Informatif",
] as const

// Schema pour la creation d'un client
export const createClientSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est obligatoire")
    .max(100, "Le nom ne doit pas depasser 100 caracteres"),
  description: z
    .string()
    .max(500, "La description ne doit pas depasser 500 caracteres")
    .optional()
    .or(z.literal("")),
  website: z
    .string()
    .url("URL invalide")
    .optional()
    .or(z.literal("")),
  industry: z.string().optional().or(z.literal("")),
  tone: z.string().optional().or(z.literal("")),
  targetAudience: z
    .string()
    .max(300, "L'audience cible ne doit pas depasser 300 caracteres")
    .optional()
    .or(z.literal("")),
  logoUrl: z.string().optional().or(z.literal("")),
})

// Schema pour la modification d'un client (tous les champs optionnels)
export const updateClientSchema = createClientSchema.partial()

export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>
