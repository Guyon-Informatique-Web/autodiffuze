// Page Analytics du dashboard
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getPlanLimits } from "@/config/plans"
import type { PlanType } from "@/config/plans"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BarChart3, TrendingUp, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { BasicStatsSection } from "./BasicStatsSection"
import { AdvancedStatsSection } from "./AdvancedStatsSection"
import { ExportButton } from "./ExportButton"

export default async function AnalyticsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const limits = getPlanLimits(user.plan as PlanType)
  const hasAdvancedAnalytics = limits.analytics

  return (
    <div className="space-y-6">
      {/* En-tete */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Statistiques et performances de vos publications
          </p>
        </div>
        {hasAdvancedAnalytics && <ExportButton />}
      </div>

      {/* Alerte upgrade si pas AGENCY */}
      {!hasAdvancedAnalytics && (
        <Alert className="border-violet-200 bg-violet-50 dark:border-violet-900 dark:bg-violet-950/50">
          <TrendingUp className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Passez au plan Agence pour acceder aux statistiques avancees,
              tendances et export CSV.
            </span>
            <Link
              href="/dashboard/settings/billing"
              className="ml-4 flex shrink-0 items-center gap-1 text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
            >
              Voir les plans
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="basic">
        <TabsList>
          <TabsTrigger value="basic" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Vue d&apos;ensemble
          </TabsTrigger>
          <TabsTrigger
            value="advanced"
            className="gap-2"
            disabled={!hasAdvancedAnalytics}
          >
            <TrendingUp className="h-4 w-4" />
            Avancees
            {!hasAdvancedAnalytics && (
              <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                AGENCE
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-6">
          <BasicStatsSection />
        </TabsContent>

        <TabsContent value="advanced" className="mt-6">
          <AdvancedStatsSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}
