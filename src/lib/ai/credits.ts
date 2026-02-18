// Gestion des credits IA : verification et consommation
import { prisma } from "@/lib/prisma"
import { getPlanLimits } from "@/config/plans"
import type { PlanType } from "@/config/plans"

// Verifie que l'utilisateur a encore des credits IA, en consomme un et retourne le solde restant
export async function checkAndConsumeAiCredit(
  userId: string,
  plan: PlanType,
  isAdmin?: boolean
): Promise<number> {
  // Bypass total pour l'administrateur : pas de limite ni de decompte
  if (isAdmin) return Infinity

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  })

  const now = new Date()
  let aiCreditsUsed = user.aiCreditsUsed

  // Reinitialisation du compteur si la periode est expiree ou non initialisee
  const shouldReset =
    !user.aiCreditsResetAt || user.aiCreditsResetAt <= now

  if (shouldReset) {
    const resetAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    await prisma.user.update({
      where: { id: userId },
      data: {
        aiCreditsUsed: 0,
        aiCreditsResetAt: resetAt,
      },
    })

    aiCreditsUsed = 0
  }

  // Verification de la limite du plan
  const planLimits = getPlanLimits(plan)
  const maxCredits = planLimits.aiGenerationsPerMonth

  if (aiCreditsUsed >= maxCredits) {
    throw new Error("Limite de credits IA atteinte")
  }

  // Consommation d'un credit
  await prisma.user.update({
    where: { id: userId },
    data: {
      aiCreditsUsed: { increment: 1 },
    },
  })

  const creditsRemaining = maxCredits - aiCreditsUsed - 1

  return creditsRemaining
}
