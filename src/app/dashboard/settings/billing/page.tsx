// Page gestion de l'abonnement et facturation
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { Separator } from "@/components/ui/separator"
import { CurrentPlanCard } from "@/components/settings/CurrentPlanCard"
import { UsageSection } from "@/components/settings/UsageSection"
import { PlanSelector } from "@/components/settings/PlanSelector"
import { ManageSubscriptionSection } from "@/components/settings/ManageSubscriptionSection"
import type { PlanType } from "@/config/plans"

export const metadata = {
  title: "Abonnement",
}

export default async function BillingPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const hasPaidSubscription = user.plan !== "FREE" && !!user.stripeSubscriptionId

  return (
    <div className="space-y-6">
      {/* En-tete */}
      <div>
        <h1 className="text-2xl font-bold">Abonnement</h1>
        <p className="text-muted-foreground">
          Gerez votre plan et votre facturation
        </p>
      </div>

      {/* Plan actuel */}
      <CurrentPlanCard plan={user.plan as PlanType} />

      <Separator />

      {/* Usage du mois */}
      <UsageSection />

      <Separator />

      {/* Changer de plan */}
      <PlanSelector
        currentPlan={user.plan as PlanType}
        hasSubscription={hasPaidSubscription}
      />

      {/* Gerer l'abonnement (si plan payant) */}
      {hasPaidSubscription && (
        <>
          <Separator />
          <ManageSubscriptionSection />
        </>
      )}
    </div>
  )
}
