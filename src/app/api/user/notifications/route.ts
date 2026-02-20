// Route API pour modifier les preferences de notifications
import { NextResponse } from "next/server"
import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { withErrorHandling } from "@/lib/api-error-handler"

const updateNotificationsSchema = z.object({
  notifyEmail: z.boolean().optional(),
  notifyDiscord: z.boolean().optional(),
  discordWebhookUrl: z.string().url("URL du webhook invalide").optional().or(z.literal("")),
})

export const PATCH = withErrorHandling(async (request: Request) => {
  try {
    const user = await requireUser()
    const body: unknown = await request.json()
    const parsed = updateNotificationsSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    // Construire les donnees a mettre a jour
    const data: {
      notifyEmail?: boolean
      notifyDiscord?: boolean
      discordWebhookUrl?: string | null
    } = {}

    if (parsed.data.notifyEmail !== undefined) {
      data.notifyEmail = parsed.data.notifyEmail
    }
    if (parsed.data.notifyDiscord !== undefined) {
      data.notifyDiscord = parsed.data.notifyDiscord
    }
    if (parsed.data.discordWebhookUrl !== undefined) {
      data.discordWebhookUrl = parsed.data.discordWebhookUrl || null
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data,
    })

    return NextResponse.json({
      notifyEmail: updatedUser.notifyEmail,
      notifyDiscord: updatedUser.notifyDiscord,
      discordWebhookUrl: updatedUser.discordWebhookUrl,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifie") {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
    }
    console.error("Erreur modification notifications:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
});
