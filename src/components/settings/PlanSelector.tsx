"use client"

// Selecteur de plan simplifie pour la page billing
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { PLANS, type PlanType } from "@/config/plans"
import { Check, Loader2 } from "lucide-react"
import { toast } from "sonner"

const planOrder: PlanType[] = ["FREE", "PRO", "AGENCY"]

interface PlanSelectorProps {
  currentPlan: PlanType
  hasSubscription: boolean
}

export function PlanSelector({
  currentPlan,
  hasSubscription,
}: PlanSelectorProps) {
  const [yearly, setYearly] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState<PlanType | null>(null)

  const handleUpgrade = async (planKey: PlanType) => {
    setLoadingPlan(planKey)

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey, yearly }),
      })

      const data: { url?: string; error?: string } = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Erreur lors de la creation de la session")
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      toast.error("Erreur de connexion au serveur")
    } finally {
      setLoadingPlan(null)
    }
  }

  const handleManageSubscription = async () => {
    setLoadingPlan(currentPlan)

    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      })

      const data: { url?: string; error?: string } = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Erreur lors de l'acces au portail")
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      toast.error("Erreur de connexion au serveur")
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Changer de plan</CardTitle>
        <CardDescription>
          Choisissez le plan qui correspond a vos besoins
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Toggle mensuel / annuel */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setYearly(false)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
              !yearly
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Mensuel
          </button>
          <button
            onClick={() => setYearly(true)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
              yearly
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Annuel
            <span className="ml-1.5 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
              -2 mois
            </span>
          </button>
        </div>

        {/* Grille des plans */}
        <div className="grid gap-4 lg:grid-cols-3">
          {planOrder.map((planKey) => {
            const plan = PLANS[planKey]
            const isCurrent = planKey === currentPlan
            const price =
              yearly && plan.yearlyPrice ? plan.yearlyPrice : plan.price
            const perMonth =
              yearly && plan.yearlyPrice
                ? (plan.yearlyPrice / 12).toFixed(2)
                : null

            return (
              <div
                key={planKey}
                className={cn(
                  "relative flex flex-col rounded-xl border p-5 transition-all",
                  isCurrent
                    ? "border-violet-500 bg-violet-50/50 shadow-md dark:border-violet-400 dark:bg-violet-950/30"
                    : "hover:shadow-sm"
                )}
              >
                {/* Badge plan actuel */}
                {isCurrent && (
                  <Badge className="absolute -top-2.5 left-4 bg-violet-600 text-white">
                    Plan actuel
                  </Badge>
                )}

                {/* Nom du plan */}
                <h3 className="mt-1 text-lg font-bold">{plan.name}</h3>

                {/* Prix */}
                <div className="mt-3 mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold tracking-tight">
                      {price === 0
                        ? "0"
                        : price.toFixed(2).replace(".", ",")}
                    </span>
                    {price > 0 && (
                      <span className="text-sm text-muted-foreground">
                        EUR/{yearly ? "an" : "mois"}
                      </span>
                    )}
                  </div>
                  {perMonth && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      soit {perMonth.replace(".", ",")} EUR/mois
                    </p>
                  )}
                </div>

                {/* Fonctionnalites */}
                <ul className="mb-4 flex-1 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-600 dark:text-violet-400" />
                      <span className="text-xs text-muted-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Bouton d'action */}
                {isCurrent ? (
                  <Button variant="outline" disabled className="w-full">
                    Plan actuel
                  </Button>
                ) : planKey === "FREE" ? (
                  hasSubscription ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleManageSubscription}
                      disabled={loadingPlan !== null}
                    >
                      {loadingPlan === planKey && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Gerer via Stripe
                    </Button>
                  ) : (
                    <Button variant="outline" disabled className="w-full">
                      Plan actuel par defaut
                    </Button>
                  )
                ) : (
                  <Button
                    className="w-full bg-gradient-to-r from-violet-600 to-blue-500 text-white hover:from-violet-700 hover:to-blue-600"
                    onClick={() => handleUpgrade(planKey)}
                    disabled={loadingPlan !== null}
                  >
                    {loadingPlan === planKey && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Passer au plan {plan.name}
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
