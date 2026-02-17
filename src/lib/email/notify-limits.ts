// Notification d'avertissement de limites de plan
import { prisma } from "@/lib/prisma"
import { sendEmail } from "./send"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://autodiffuze.com"

// Notifie un utilisateur qu'il approche de la limite de son plan
export async function notifyPlanLimitWarning(
  userId: string,
  limitType: string,
  currentUsage: number,
  maxLimit: number
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, notifyEmail: true },
    })

    if (!user) return

    const percentage = Math.round((currentUsage / maxLimit) * 100)
    const limitLabels: Record<string, string> = {
      publications: "publications par mois",
      aiCredits: "generations IA par mois",
      clients: "clients",
      platforms: "plateformes connectees",
    }

    const limitLabel = limitLabels[limitType] ?? limitType
    const title = `Limite atteinte a ${percentage}%`
    const message = `Vous avez utilise ${currentUsage} sur ${maxLimit} ${limitLabel}. Passez a un plan superieur pour continuer.`

    // Creation de la notification in-app
    await prisma.notification.create({
      data: {
        userId,
        type: "PLAN_LIMIT_WARNING",
        title,
        message,
        metadata: { limitType, currentUsage, maxLimit, percentage },
      },
    })

    // Envoi de l'email si les preferences le permettent
    if (user.notifyEmail) {
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d97706;">Avertissement de limite</h2>
          <p>Bonjour ${user.name ?? ""},</p>
          <p>${message}</p>
          <p>
            <a href="${APP_URL}/dashboard/settings/billing"
               style="display: inline-block; padding: 10px 20px; background: #7c3aed; color: white; text-decoration: none; border-radius: 6px;">
              Voir les plans
            </a>
          </p>
        </div>
      `

      await sendEmail(
        user.email,
        `Autodiffuze - ${title}`,
        html
      )
    }
  } catch (err) {
    console.error(
      `[Notification] Erreur envoi avertissement limite (user=${userId}, type=${limitType}) :`,
      err
    )
  }
}
