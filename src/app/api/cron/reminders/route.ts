// Cron job de rappel des publications planifiees pour demain
// Envoie un email de rappel a chaque utilisateur ayant des publications prevues le lendemain
// Appele une fois par jour via Vercel Cron (ou equivalent) avec authentification par CRON_SECRET
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { notifyScheduledReminder } from "@/lib/email/notify"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  // Verifier l'authentification du cron
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error("CRON_SECRET non configure dans les variables d'environnement")
    return NextResponse.json(
      { error: "Configuration serveur manquante" },
      { status: 500 }
    )
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Non autorise" },
      { status: 401 }
    )
  }

  try {
    // Calculer la plage "demain" (de minuit demain a minuit apres-demain, en UTC)
    const now = new Date()
    const tomorrowStart = new Date(now)
    tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1)
    tomorrowStart.setUTCHours(0, 0, 0, 0)

    const tomorrowEnd = new Date(tomorrowStart)
    tomorrowEnd.setUTCDate(tomorrowEnd.getUTCDate() + 1)

    // Recuperer les publications SCHEDULED prevues demain
    const scheduledPublications = await prisma.publication.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: {
          gte: tomorrowStart,
          lt: tomorrowEnd,
        },
      },
      include: {
        platformPublications: {
          include: {
            platformConnection: {
              select: { platform: true },
            },
          },
        },
      },
    })

    if (scheduledPublications.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Aucune publication planifiee pour demain",
        usersNotified: 0,
      })
    }

    // Grouper par utilisateur
    const publicationsByUser = new Map<
      string,
      Array<{ title: string; scheduledAt: Date; platforms: string[] }>
    >()

    for (const pub of scheduledPublications) {
      const existing = publicationsByUser.get(pub.userId) ?? []
      existing.push({
        title: pub.title ?? "Sans titre",
        scheduledAt: pub.scheduledAt!,
        platforms: pub.platformPublications.map(
          (pp) => pp.platformConnection.platform
        ),
      })
      publicationsByUser.set(pub.userId, existing)
    }

    // Envoyer les rappels a chaque utilisateur
    let usersNotified = 0
    const errors: string[] = []

    for (const [userId, publications] of publicationsByUser) {
      try {
        await notifyScheduledReminder(userId, publications)
        usersNotified++
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erreur inconnue"
        console.error(
          `[Cron Reminders] Erreur envoi rappel pour l'utilisateur ${userId} :`,
          err
        )
        errors.push(`user=${userId}: ${message}`)
      }
    }

    return NextResponse.json({
      success: true,
      totalPublications: scheduledPublications.length,
      usersNotified,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("Erreur critique dans le cron de rappels :", error)
    return NextResponse.json(
      { error: "Erreur interne du cron de rappels" },
      { status: 500 }
    )
  }
}
