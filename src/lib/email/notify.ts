// Fonctions de notification de haut niveau
// Recuperent les donnees en BDD, verifient les preferences utilisateur
// et envoient les emails via les templates
import { prisma } from "@/lib/prisma"
import { sendEmail } from "./send"
import {
  publishFailedEmail,
  tokenExpiredEmail,
  scheduledReminderEmail,
} from "./templates"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://autodiffuze.com"

// Notifie un utilisateur qu'une publication a echoue sur certaines plateformes
export async function notifyPublishFailed(
  userId: string,
  publicationId: string,
  failedPlatforms: { name: string; error: string }[]
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, notifyEmail: true },
    })

    if (!user || !user.notifyEmail) return

    const publication = await prisma.publication.findUnique({
      where: { id: publicationId },
      select: { title: true },
    })

    if (!publication) return

    const publicationTitle = publication.title ?? "Sans titre"

    // Notification in-app
    const platformsList = failedPlatforms.map((p) => p.name).join(", ")
    await prisma.notification.create({
      data: {
        userId,
        type: "PUBLISH_FAILED",
        title: `Publication echouee - ${publicationTitle}`,
        message: `La publication "${publicationTitle}" a echoue sur : ${platformsList}`,
        metadata: { publicationId, failedPlatforms },
      },
    })

    // Notification email
    const html = publishFailedEmail({
      userName: user.name ?? "",
      publicationTitle,
      platforms: failedPlatforms,
      dashboardUrl: `${APP_URL}/dashboard/publications`,
    })

    await sendEmail(
      user.email,
      `Publication echouee - ${publicationTitle}`,
      html
    )
  } catch (err) {
    console.error(
      `[Notification] Erreur envoi notification publication echouee (user=${userId}, pub=${publicationId}) :`,
      err
    )
  }
}

// Notifie un utilisateur qu'un token de connexion plateforme a expire
export async function notifyTokenExpired(
  userId: string,
  platformName: string,
  clientName: string,
  clientId: string
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, notifyEmail: true },
    })

    if (!user || !user.notifyEmail) return

    // Notification in-app
    await prisma.notification.create({
      data: {
        userId,
        type: "TOKEN_EXPIRED",
        title: `Connexion expiree - ${platformName}`,
        message: `Le token de connexion ${platformName} pour le client "${clientName}" a expire. Reconnectez-vous pour continuer a publier.`,
        metadata: { platformName, clientName, clientId },
      },
    })

    // Notification email
    const html = tokenExpiredEmail({
      userName: user.name ?? "",
      platformName,
      clientName,
      reconnectUrl: `${APP_URL}/dashboard/clients/${clientId}/platforms`,
    })

    await sendEmail(
      user.email,
      `Connexion expiree - ${platformName} (${clientName})`,
      html
    )
  } catch (err) {
    console.error(
      `[Notification] Erreur envoi notification token expire (user=${userId}, platform=${platformName}) :`,
      err
    )
  }
}

// Notifie un utilisateur des publications planifiees pour demain
export async function notifyScheduledReminder(
  userId: string,
  publications: Array<{
    title: string
    scheduledAt: Date
    platforms: string[]
  }>
): Promise<void> {
  try {
    if (publications.length === 0) return

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, notifyEmail: true },
    })

    if (!user || !user.notifyEmail) return

    const count = publications.length

    // Notification in-app
    const pubTitles = publications.map((p) => p.title).join(", ")
    await prisma.notification.create({
      data: {
        userId,
        type: "SCHEDULED_REMINDER",
        title: `${count} publication${count > 1 ? "s" : ""} planifiee${count > 1 ? "s" : ""} demain`,
        message: `Publications prevues : ${pubTitles}`,
        metadata: { count, publications: publications.map((p) => p.title) },
      },
    })

    // Notification email
    const html = scheduledReminderEmail({
      userName: user.name ?? "",
      publications,
      dashboardUrl: `${APP_URL}/dashboard/publications`,
    })

    await sendEmail(
      user.email,
      `Rappel : ${count} publication${count > 1 ? "s" : ""} planifiee${count > 1 ? "s" : ""} demain`,
      html
    )
  } catch (err) {
    console.error(
      `[Notification] Erreur envoi rappel publications planifiees (user=${userId}) :`,
      err
    )
  }
}
