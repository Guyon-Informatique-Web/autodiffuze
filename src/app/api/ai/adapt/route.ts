// Route API pour l'adaptation de contenu a une plateforme specifique
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { anthropic } from "@/lib/ai/anthropic"
import { checkAndConsumeAiCredit } from "@/lib/ai/credits"
import { adaptContentSchema } from "@/lib/validations/ai"
import { PLATFORM_CONFIG } from "@/config/platforms"
import type { PlatformKey } from "@/config/platforms"
import type { PlanType } from "@/config/plans"

// Separe le contenu du post et les hashtags de la reponse IA
function parseAdaptedResponse(rawContent: string): {
  adaptedContent: string
  hashtags: string[]
} {
  const lines = rawContent.trim().split("\n")

  // Recherche de la derniere ligne contenant des hashtags
  const lastLine = lines[lines.length - 1]?.trim() ?? ""
  const hasHashtagLine = lastLine.startsWith("#")

  if (hasHashtagLine && lines.length > 1) {
    // Extraction des hashtags depuis la derniere ligne
    const hashtags = lastLine
      .split(/\s+/)
      .filter((word) => word.startsWith("#"))
      .map((tag) => tag.replace(/^#+/, ""))
      .filter((tag) => tag.length > 0)

    // Le contenu est tout sauf la derniere ligne (et la ligne vide precedente si elle existe)
    let contentLines = lines.slice(0, -1)

    // Retirer la ligne vide de separation si presente
    if (contentLines.length > 0 && contentLines[contentLines.length - 1]?.trim() === "") {
      contentLines = contentLines.slice(0, -1)
    }

    const adaptedContent = contentLines.join("\n").trim()

    return { adaptedContent, hashtags }
  }

  // Pas de hashtags detectes : tout est du contenu
  return { adaptedContent: rawContent.trim(), hashtags: [] }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser()

    const body: unknown = await request.json()
    const validation = adaptContentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { baseContent, platform, clientId, useEmojis } = validation.data

    // Verification que le client appartient a l'utilisateur
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: user.id,
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: "Client non trouve" },
        { status: 404 }
      )
    }

    // Consommation d'un credit IA
    const creditsRemaining = await checkAndConsumeAiCredit(
      user.id,
      user.plan as PlanType,
      user.isAdmin
    )

    // Recuperation de la configuration de la plateforme cible
    const platformConfig = PLATFORM_CONFIG[platform as PlatformKey]

    // Instruction conditionnelle pour les emojis
    const emojiInstruction = useEmojis
      ? "Utilise des emojis pertinents pour rendre le contenu plus attractif et structurer visuellement le texte."
      : "N'utilise aucun emoji dans le contenu."

    // Construction du prompt systeme avec le contexte de la plateforme
    const systemPrompt = `Tu es un expert en communication digitale.
Tu adaptes un contenu existant pour une plateforme specifique.

Contenu original :
${baseContent}

Plateforme cible : ${platformConfig.name}
Limites : ${platformConfig.limits.maxChars} caracteres max, ${platformConfig.limits.maxHashtags} hashtags max
Conseils pour cette plateforme : ${platformConfig.toneGuidance}
${emojiInstruction}

Adapte le contenu en respectant :
- Les limites de caracteres de la plateforme
- Le ton et les codes de la plateforme
- Le nombre recommande de hashtags
- La structure optimale pour cette plateforme

Reponds UNIQUEMENT avec le contenu adapte.
Les hashtags doivent etre sur une ligne separee a la fin.`

    // Appel a l'API Anthropic
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: baseContent,
        },
      ],
    })

    // Extraction du contenu texte de la reponse
    const textBlock = message.content.find((block) => block.type === "text")
    const rawContent = textBlock?.text ?? ""

    // Parsing pour separer le contenu et les hashtags
    const { adaptedContent, hashtags } = parseAdaptedResponse(rawContent)

    return NextResponse.json({ adaptedContent, hashtags, creditsRemaining })
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifie") {
      return NextResponse.json(
        { error: "Non authentifie" },
        { status: 401 }
      )
    }

    if (
      error instanceof Error &&
      error.message === "Limite de credits IA atteinte"
    ) {
      return NextResponse.json(
        { error: "Limite de credits IA atteinte" },
        { status: 403 }
      )
    }

    console.error("Erreur lors de l'adaptation IA :", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
