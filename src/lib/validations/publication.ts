// Schemas de validation Zod pour les publications
import { z } from "zod"

// Types de contenu disponibles
const contentTypeValues = ["POST", "STORY", "REEL", "ARTICLE", "THREAD"] as const

// Schema pour une publication sur une plateforme
const platformPublicationSchema = z.object({
  platformConnectionId: z.string().min(1, "L'identifiant de connexion plateforme est obligatoire"),
  adaptedContent: z.string().min(1, "Le contenu adapte est obligatoire"),
  hashtags: z.array(z.string()).optional(),
})

// Schema pour la creation d'une publication
export const createPublicationSchema = z.object({
  clientId: z.string().min(1, "L'identifiant du client est obligatoire"),
  title: z
    .string()
    .max(200, "Le titre ne doit pas depasser 200 caracteres")
    .optional()
    .or(z.literal("")),
  baseContent: z.string().min(1, "Le contenu est obligatoire"),
  contentType: z.enum(contentTypeValues).default("POST"),
  mediaUrls: z.array(z.string()).optional(),
  mediaTypes: z.array(z.string()).optional(),
  scheduledAt: z
    .string()
    .datetime({ message: "La date de planification doit etre au format ISO" })
    .optional()
    .refine(
      (val) => {
        if (!val) return true
        return new Date(val) > new Date()
      },
      { message: "La date de planification doit etre dans le futur" }
    ),
  aiGenerated: z.boolean().optional(),
  aiPrompt: z.string().optional().or(z.literal("")),
  templateId: z.string().optional().or(z.literal("")),
  platforms: z.array(platformPublicationSchema).optional(),
})

// Schema pour la modification d'une publication (sans clientId, tous les autres optionnels)
export const updatePublicationSchema = createPublicationSchema
  .omit({ clientId: true })
  .partial()

export type CreatePublicationInput = z.infer<typeof createPublicationSchema>
export type UpdatePublicationInput = z.infer<typeof updatePublicationSchema>
