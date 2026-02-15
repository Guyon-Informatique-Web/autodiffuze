// Verification centralisee des limites selon le plan de l'utilisateur
import { prisma } from "@/lib/prisma"
import { getPlanLimits } from "@/config/plans"
import type { PlanType } from "@/config/plans"

// Types de verification de limites supportes
export type LimitCheck =
  | { type: "clients" }
  | { type: "publications" }
  | { type: "platforms"; clientId: string }
  | { type: "media"; count: number }
  | { type: "scheduling" }
  | { type: "templates" }

// Resultat d'une verification de limite
export interface LimitCheckResult {
  allowed: boolean
  current: number
  max: number
  message: string
}

// Verifie si l'utilisateur a atteint la limite pour le type donne
export async function checkPlanLimit(
  userId: string,
  plan: PlanType,
  check: LimitCheck
): Promise<LimitCheckResult> {
  const limits = getPlanLimits(plan)

  switch (check.type) {
    case "clients": {
      const current = await prisma.client.count({
        where: { userId },
      })
      const max = limits.maxClients
      return {
        allowed: current < max,
        current,
        max,
        message:
          current >= max
            ? `Limite atteinte : votre plan permet ${max} client(s) maximum. Passez a un plan superieur pour en ajouter davantage.`
            : `${current}/${max} clients utilises`,
      }
    }

    case "publications": {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const current = await prisma.publication.count({
        where: {
          userId,
          createdAt: { gte: startOfMonth },
        },
      })
      const max = limits.maxPublicationsPerMonth
      return {
        allowed: current < max,
        current,
        max,
        message:
          current >= max
            ? `Limite atteinte : votre plan permet ${max} publication(s) par mois. Passez a un plan superieur pour en creer davantage.`
            : `${current}/${max} publications ce mois-ci`,
      }
    }

    case "platforms": {
      const current = await prisma.platformConnection.count({
        where: {
          clientId: check.clientId,
          isActive: true,
        },
      })
      const max = limits.maxPlatforms
      return {
        allowed: current < max,
        current,
        max,
        message:
          current >= max
            ? `Limite atteinte : votre plan permet ${max} plateforme(s) par client. Passez a un plan superieur pour en connecter davantage.`
            : `${current}/${max} plateformes connectees pour ce client`,
      }
    }

    case "media": {
      const current = check.count
      const max = limits.maxMediaPerPublication
      return {
        allowed: current <= max,
        current,
        max,
        message:
          current > max
            ? `Limite atteinte : votre plan permet ${max} media(s) par publication. Passez a un plan superieur pour en ajouter davantage.`
            : `${current}/${max} medias`,
      }
    }

    case "scheduling": {
      return {
        allowed: limits.scheduling,
        current: limits.scheduling ? 1 : 0,
        max: 1,
        message: limits.scheduling
          ? "Planification disponible"
          : "La planification n'est pas disponible avec votre plan actuel. Passez au plan Pro ou Agence pour y acceder.",
      }
    }

    case "templates": {
      return {
        allowed: limits.templates,
        current: limits.templates ? 1 : 0,
        max: 1,
        message: limits.templates
          ? "Templates disponibles"
          : "Les templates ne sont pas disponibles avec votre plan actuel. Passez au plan Pro ou Agence pour y acceder.",
      }
    }
  }
}
