"use client"

// Carte affichant le plan actuel de l'utilisateur
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PLANS, type PlanType } from "@/config/plans"

interface CurrentPlanCardProps {
  plan: PlanType
}

export function CurrentPlanCard({ plan }: CurrentPlanCardProps) {
  const planConfig = PLANS[plan]
  const isFree = plan === "FREE"

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Plan actuel</CardTitle>
          <Badge variant="default">Actif</Badge>
        </div>
        <CardDescription>
          {isFree
            ? "Plan Gratuit - Passez au plan superieur pour debloquer plus de fonctionnalites"
            : `Plan ${planConfig.name}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold">
            {planConfig.price === 0
              ? "Gratuit"
              : `${planConfig.price.toFixed(2).replace(".", ",")} EUR`}
          </span>
          {planConfig.price > 0 && (
            <span className="text-sm text-muted-foreground">/mois</span>
          )}
        </div>
        {!isFree && (
          <p className="mt-2 text-sm text-muted-foreground">
            Prochain renouvellement : selon votre facturation Stripe
          </p>
        )}
      </CardContent>
    </Card>
  )
}
