// Fonctions utilitaires pour la correspondance plans / prix Stripe
import type { PlanType } from "@/config/plans"

// Retourne le priceId Stripe correspondant au plan et a la periodicite
export function getStripePriceId(
  plan: PlanType,
  yearly: boolean
): string | null {
  switch (plan) {
    case "FREE":
      return null
    case "PRO":
      return yearly
        ? (process.env.STRIPE_PRO_YEARLY_PRICE_ID ?? null)
        : (process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? null)
    case "AGENCY":
      return yearly
        ? (process.env.STRIPE_AGENCY_YEARLY_PRICE_ID ?? null)
        : (process.env.STRIPE_AGENCY_MONTHLY_PRICE_ID ?? null)
  }
}

// Determine le plan a partir d'un priceId Stripe
export function getPlanFromPriceId(priceId: string): PlanType {
  const proMonthly = process.env.STRIPE_PRO_MONTHLY_PRICE_ID
  const proYearly = process.env.STRIPE_PRO_YEARLY_PRICE_ID
  const agencyMonthly = process.env.STRIPE_AGENCY_MONTHLY_PRICE_ID
  const agencyYearly = process.env.STRIPE_AGENCY_YEARLY_PRICE_ID

  if (priceId === proMonthly || priceId === proYearly) {
    return "PRO"
  }

  if (priceId === agencyMonthly || priceId === agencyYearly) {
    return "AGENCY"
  }

  return "FREE"
}
