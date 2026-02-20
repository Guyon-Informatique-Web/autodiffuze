// Route API pour recuperer l'usage courant de l'utilisateur
import { NextResponse } from "next/server"
import { requireUser } from "@/lib/auth"
import { getUserUsage } from "@/lib/plan-usage"
import { getPlanLimits, PLANS } from "@/config/plans"
import type { PlanType } from "@/config/plans"
import { withErrorHandling } from "@/lib/api-error-handler"

// GET : Retourne l'usage courant, le plan actuel et les limites du plan
export const GET = withErrorHandling(async () => {
  try {
    const user = await requireUser()

    const plan = user.plan as PlanType
    const usage = await getUserUsage(user.id, plan, user.isAdmin)
    const limits = getPlanLimits(plan, user.isAdmin)
    const planConfig = PLANS[plan]

    return NextResponse.json({
      plan: {
        type: plan,
        name: planConfig.name,
      },
      usage,
      limits,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifie") {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
});
