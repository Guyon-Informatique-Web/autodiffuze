// Schemas de validation Zod pour les templates
import { z } from "zod"

// Types de contenu supportes
export const CONTENT_TYPES = [
  "POST",
  "STORY",
  "REEL",
  "ARTICLE",
  "THREAD",
] as const

// Types de plateforme supportes
export const PLATFORM_TYPES = [
  "FACEBOOK",
  "INSTAGRAM",
  "LINKEDIN",
  "X",
  "TIKTOK",
] as const

// Categories de templates
export const TEMPLATE_CATEGORIES = [
  "Promotion",
  "Evenement",
  "Actualite",
  "Temoignage",
  "Conseil",
  "Autre",
] as const

// Variables disponibles dans le contenu des templates
export const TEMPLATE_VARIABLES = [
  "{{nom_client}}",
  "{{produit}}",
  "{{date}}",
  "{{lien}}",
] as const

// Schema pour la creation d'un template
export const createTemplateSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est obligatoire")
    .max(100, "Le nom ne doit pas depasser 100 caracteres"),
  description: z
    .string()
    .max(300, "La description ne doit pas depasser 300 caracteres")
    .optional()
    .or(z.literal("")),
  baseContent: z
    .string()
    .min(1, "Le contenu de base est obligatoire"),
  contentType: z
    .enum(CONTENT_TYPES)
    .default("POST"),
  platforms: z
    .array(z.enum(PLATFORM_TYPES))
    .optional(),
  hashtags: z
    .array(z.string())
    .optional(),
  category: z
    .string()
    .optional()
    .or(z.literal("")),
})

// Schema pour la modification d'un template (tous les champs optionnels)
export const updateTemplateSchema = createTemplateSchema.partial()

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>
