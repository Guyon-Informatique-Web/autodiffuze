// Route API pour la generation de contenu IA
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { anthropic } from "@/lib/ai/anthropic"
import { checkAndConsumeAiCredit } from "@/lib/ai/credits"
import { generateContentSchema } from "@/lib/validations/ai"
import type { PlanType } from "@/config/plans"

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser()

    const body: unknown = await request.json()
    const validation = generateContentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { clientId, prompt } = validation.data

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
      user.plan as PlanType
    )

    // Construction du prompt systeme avec le contexte du client
    const systemPrompt = `Tu es un expert en communication digitale et community management.
Tu rediges du contenu engageant pour les reseaux sociaux.

Contexte du client :
- Nom : ${client.name}
- Secteur : ${client.industry ?? "Non precise"}
- Ton souhaite : ${client.tone ?? "Non precise"}
- Audience cible : ${client.targetAudience ?? "Non precise"}
- Description : ${client.description ?? "Non precise"}

Redige un post pour les reseaux sociaux en respectant :
- Le ton demande par le client
- Une structure engageante (accroche, developpement, appel a l'action)
- La longueur adaptee aux reseaux sociaux (ni trop court, ni trop long)
- Suggere des hashtags pertinents (separes du texte principal)

Reponds UNIQUEMENT avec le contenu du post suivi des hashtags suggeres.
Ne mets pas de titre, de preambule ou d'explication.`

    // Appel a l'API Anthropic
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })

    // Extraction du contenu texte de la reponse
    const textBlock = message.content.find((block) => block.type === "text")
    const content = textBlock?.text ?? ""

    return NextResponse.json({ content, creditsRemaining })
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

    console.error("Erreur lors de la generation IA :", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
