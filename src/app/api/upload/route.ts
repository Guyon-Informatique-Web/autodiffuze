// Route API pour l'upload de medias vers Supabase Storage
import { NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { getPlanLimits } from "@/config/plans"
import type { PlanType } from "@/config/plans"
import { withErrorHandling } from "@/lib/api-error-handler"

// Types MIME acceptes pour l'upload
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
] as const

type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]

// Correspondance type MIME -> extension de fichier
const MIME_TO_EXTENSION: Record<AllowedMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "video/mp4": "mp4",
}

// Genere un identifiant aleatoire pour le nom de fichier
function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 10)
}

// POST : Upload d'un media vers le bucket Supabase "media"
export const POST = withErrorHandling(async (request: NextRequest) => {
  try {
    const user = await requireUser()

    // Recuperation des limites du plan utilisateur
    const planLimits = getPlanLimits(user.plan as PlanType, user.isAdmin)
    const maxSizeBytes = planLimits.maxMediaSizeMB * 1024 * 1024

    // Lecture du FormData
    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json(
        { error: "Requete invalide : FormData attendu" },
        { status: 400 }
      )
    }

    const file = formData.get("file")

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      )
    }

    // Verification du type MIME
    if (!ALLOWED_MIME_TYPES.includes(file.type as AllowedMimeType)) {
      return NextResponse.json(
        {
          error: `Type de fichier non supporte : ${file.type}. Types acceptes : ${ALLOWED_MIME_TYPES.join(", ")}`,
        },
        { status: 400 }
      )
    }

    // Verification de la taille du fichier
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        {
          error: `Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} Mo). Taille maximale autorisee : ${planLimits.maxMediaSizeMB} Mo`,
        },
        { status: 400 }
      )
    }

    // Generation du chemin unique dans le bucket
    const extension = MIME_TO_EXTENSION[file.type as AllowedMimeType]
    const timestamp = Date.now()
    const randomId = generateRandomId()
    const filePath = `${user.id}/${timestamp}-${randomId}.${extension}`

    // Conversion du fichier en buffer pour l'upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload vers Supabase Storage
    const supabase = await createClient()
    const { data, error } = await supabase.storage
      .from("media")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      console.error("Erreur Supabase Storage :", error)
      return NextResponse.json(
        { error: "Erreur lors de l'upload du fichier" },
        { status: 500 }
      )
    }

    // Recuperation de l'URL publique
    const {
      data: { publicUrl },
    } = supabase.storage.from("media").getPublicUrl(data.path)

    return NextResponse.json({
      url: publicUrl,
      type: file.type,
      name: file.name,
      size: file.size,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifie") {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
    }
    console.error("Erreur upload :", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
});
