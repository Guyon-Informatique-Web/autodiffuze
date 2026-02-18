// Recuperation de l'usage courant de l'utilisateur pour l'affichage billing
import { prisma } from "@/lib/prisma"
import { getPlanLimits } from "@/config/plans"
import type { PlanType } from "@/config/plans"

// Usage courant de l'utilisateur par rapport aux limites de son plan
export interface PlanUsage {
  clients: { current: number; max: number }
  publications: { current: number; max: number }
  aiCredits: { used: number; max: number; resetsAt: Date | null }
  platforms: { current: number; max: number }
  scheduling: boolean
  templates: boolean
}

// Recupere l'usage courant de l'utilisateur pour toutes les limites du plan
export async function getUserUsage(
  userId: string,
  plan: PlanType,
  isAdmin?: boolean
): Promise<PlanUsage> {
  const limits = getPlanLimits(plan, isAdmin)

  // Debut du mois en cours pour le comptage des publications
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  // Requetes en parallele pour optimiser les performances
  const [clientCount, publicationsThisMonth, user, platformCount] =
    await Promise.all([
      // Nombre total de clients de l'utilisateur
      prisma.client.count({
        where: { userId },
      }),

      // Publications creees ce mois-ci
      prisma.publication.count({
        where: {
          userId,
          createdAt: { gte: startOfMonth },
        },
      }),

      // Donnees utilisateur pour les credits IA
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          aiCreditsUsed: true,
          aiCreditsResetAt: true,
        },
      }),

      // Nombre total de connexions actives toutes plateformes confondues
      prisma.platformConnection.count({
        where: {
          userId,
          isActive: true,
        },
      }),
    ])

  // Reinitialisation des credits IA si la periode est expiree
  const now = new Date()
  const shouldResetCredits =
    !user.aiCreditsResetAt || user.aiCreditsResetAt <= now
  const aiCreditsUsed = shouldResetCredits ? 0 : user.aiCreditsUsed
  const aiCreditsResetAt = shouldResetCredits ? null : user.aiCreditsResetAt

  return {
    clients: {
      current: clientCount,
      max: limits.maxClients,
    },
    publications: {
      current: publicationsThisMonth,
      max: limits.maxPublicationsPerMonth,
    },
    aiCredits: {
      used: aiCreditsUsed,
      max: limits.aiGenerationsPerMonth,
      resetsAt: aiCreditsResetAt,
    },
    platforms: {
      current: platformCount,
      max: limits.maxPlatforms,
    },
    scheduling: limits.scheduling,
    templates: limits.templates,
  }
}
