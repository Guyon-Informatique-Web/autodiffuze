// Plans tarifaires et limites

export type PlanType = "FREE" | "PRO" | "AGENCY"

export interface PlanLimits {
  maxClients: number
  maxPublicationsPerMonth: number
  maxPlatforms: number
  maxMediaPerPublication: number
  maxMediaSizeMB: number
  aiGenerationsPerMonth: number
  scheduling: boolean
  templates: boolean
  analytics: boolean
}

export interface PlanConfig {
  name: string
  price: number
  yearlyPrice?: number
  limits: PlanLimits
  features: string[]
}

export const PLANS: Record<PlanType, PlanConfig> = {
  FREE: {
    name: "Gratuit",
    price: 0,
    limits: {
      maxClients: 1,
      maxPublicationsPerMonth: 10,
      maxPlatforms: 2,
      maxMediaPerPublication: 1,
      maxMediaSizeMB: 5,
      aiGenerationsPerMonth: 5,
      scheduling: false,
      templates: false,
      analytics: false,
    },
    features: [
      "1 client / marque",
      "10 publications par mois",
      "2 plateformes connectees",
      "5 generations IA par mois",
      "Publication immediate",
    ],
  },
  PRO: {
    name: "Pro",
    price: 19.99,
    yearlyPrice: 199.99,
    limits: {
      maxClients: 5,
      maxPublicationsPerMonth: 100,
      maxPlatforms: 5,
      maxMediaPerPublication: 10,
      maxMediaSizeMB: 25,
      aiGenerationsPerMonth: 50,
      scheduling: true,
      templates: true,
      analytics: false,
    },
    features: [
      "5 clients / marques",
      "100 publications par mois",
      "Toutes les plateformes",
      "50 generations IA par mois",
      "Planification programmee",
      "Modeles reutilisables",
      "Jusqu'a 10 medias par publication",
    ],
  },
  AGENCY: {
    name: "Agence",
    price: 49.99,
    yearlyPrice: 499.99,
    limits: {
      maxClients: 25,
      maxPublicationsPerMonth: 500,
      maxPlatforms: 5,
      maxMediaPerPublication: 20,
      maxMediaSizeMB: 50,
      aiGenerationsPerMonth: 200,
      scheduling: true,
      templates: true,
      analytics: true,
    },
    features: [
      "25 clients / marques",
      "500 publications par mois",
      "Toutes les plateformes",
      "200 generations IA par mois",
      "Planification programmee",
      "Modeles reutilisables",
      "Statistiques avancees",
      "Support prioritaire",
      "Export des donnees",
    ],
  },
} as const

// Limites illimitees pour l'administrateur du SaaS
const ADMIN_LIMITS: PlanLimits = {
  maxClients: 999999,
  maxPublicationsPerMonth: 999999,
  maxPlatforms: 5,
  maxMediaPerPublication: 20,
  maxMediaSizeMB: 50,
  aiGenerationsPerMonth: 999999,
  scheduling: true,
  templates: true,
  analytics: true,
}

// Utilitaire pour recuperer les limites d'un plan (bypass total si admin)
export function getPlanLimits(plan: PlanType, isAdmin?: boolean): PlanLimits {
  if (isAdmin) return ADMIN_LIMITS
  return PLANS[plan].limits
}
