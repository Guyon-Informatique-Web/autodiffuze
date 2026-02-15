"use client"

// Cartes de pricing avec toggle mensuel/annuel
import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { PLANS, type PlanType } from "@/config/plans"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

const planOrder: PlanType[] = ["FREE", "PRO", "AGENCY"]

export function PricingCards() {
  const [yearly, setYearly] = useState(false)

  return (
    <section className="py-20 sm:py-28" id="pricing">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* En-tete */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-violet-600 dark:text-violet-400">
            Tarifs
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Un plan pour chaque{" "}
            <span className="text-gradient">ambition</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Commencez gratuitement, evoluez quand vous etes pret.
          </p>
        </div>

        {/* Toggle mensuel / annuel */}
        <div className="mt-10 flex items-center justify-center gap-3">
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
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {planOrder.map((planKey) => {
            const plan = PLANS[planKey]
            const isPro = planKey === "PRO"
            const price = yearly && plan.yearlyPrice
              ? plan.yearlyPrice
              : plan.price
            const perMonth = yearly && plan.yearlyPrice
              ? (plan.yearlyPrice / 12).toFixed(2)
              : null

            return (
              <div
                key={planKey}
                className={cn(
                  "relative flex flex-col rounded-2xl border bg-card p-6 transition-all duration-300",
                  isPro
                    ? "card-gradient-border shadow-lg shadow-violet-500/10 scale-[1.02] lg:scale-105"
                    : "hover:shadow-md"
                )}
              >
                {/* Badge populaire */}
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-gradient-to-r from-violet-600 to-blue-500 px-4 py-1 text-xs font-semibold text-white shadow-md">
                      Populaire
                    </span>
                  </div>
                )}

                {/* Nom du plan */}
                <div className="mb-4">
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                </div>

                {/* Prix */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tight">
                      {price === 0 ? "0" : price.toFixed(2).replace(".", ",")}
                    </span>
                    {price > 0 && (
                      <span className="text-sm text-muted-foreground">
                        EUR/{yearly ? "an" : "mois"}
                      </span>
                    )}
                  </div>
                  {perMonth && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      soit {perMonth.replace(".", ",")} EUR/mois
                    </p>
                  )}
                  {price === 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Pour toujours
                    </p>
                  )}
                </div>

                {/* Bouton */}
                <Button
                  asChild
                  className={cn(
                    "mb-6 w-full",
                    isPro
                      ? "bg-gradient-to-r from-violet-600 to-blue-500 text-white hover:from-violet-700 hover:to-blue-600"
                      : ""
                  )}
                  variant={isPro ? "default" : "outline"}
                >
                  <Link href="/register">
                    {price === 0 ? "Demarrer gratuitement" : "Essai gratuit"}
                  </Link>
                </Button>

                {/* Liste des fonctionnalites */}
                <ul className="flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
