// Route API pour recuperer l'usage courant de l'utilisateur
import { NextResponse } from "next/server"
import { requireUser } from "@/lib/auth"
import { getUserUsage } from "@/lib/plan-usage"
import { getPlanLimits, PLANS } from "@/config/plans"
import type { PlanType } from "@/config/plans"

// GET : Retourne l'usage courant, le plan actuel et les limites du plan
export async function GET() {
  try {
    const user = await requireUser()

    const plan = user.plan as PlanType
    const usage = await getUserUsage(user.id, plan)
    const limits = getPlanLimits(plan)
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
}
