// Panel admin -- vue d'ensemble avec statistiques globales
import Link from "next/link"
import {
  Users,
  FileText,
  Link2,
  CreditCard,
  ArrowRight,
  Shield,
  TrendingUp,
} from "lucide-react"

import { requireAdmin } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { PLANS, type PlanType } from "@/config/plans"

import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export const metadata = {
  title: "Administration",
}

export default async function AdminPage() {
  await requireAdmin()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Requetes paralleles pour toutes les stats
  const [
    totalUsers,
    usersThisMonth,
    usersByPlan,
    totalPublications,
    publicationsThisMonth,
    publishedCount,
    failedCount,
    totalConnections,
    activeConnections,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.user.groupBy({ by: ["plan"], _count: true }),
    prisma.publication.count(),
    prisma.publication.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.publication.count({ where: { status: "PUBLISHED" } }),
    prisma.publication.count({ where: { status: "FAILED" } }),
    prisma.platformConnection.count(),
    prisma.platformConnection.count({ where: { isActive: true } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        _count: {
          select: {
            publications: true,
            clients: true,
            platformConnections: true,
          },
        },
      },
    }),
  ])

  // Repartition par plan
  const planCounts: Record<string, number> = { FREE: 0, PRO: 0, AGENCY: 0 }
  for (const group of usersByPlan) {
    planCounts[group.plan] = group._count
  }

  // Revenus mensuels estimes
  const estimatedMRR =
    planCounts.PRO * PLANS.PRO.price +
    planCounts.AGENCY * PLANS.AGENCY.price

  return (
    <div className="space-y-6">
      {/* En-tete */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-red-600 to-orange-500">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Administration</h1>
          <p className="text-muted-foreground">Vue d&apos;ensemble de la plateforme</p>
        </div>
      </div>

      {/* Stats principales */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Utilisateurs
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +{usersThisMonth} ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Publications
            </CardTitle>
            <FileText className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPublications}</div>
            <p className="text-xs text-muted-foreground">
              +{publicationsThisMonth} ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Connexions actives
            </CardTitle>
            <Link2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeConnections}</div>
            <p className="text-xs text-muted-foreground">
              sur {totalConnections} totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              MRR estime
            </CardTitle>
            <CreditCard className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estimatedMRR.toFixed(2)} EUR</div>
            <p className="text-xs text-muted-foreground">
              revenus mensuels recurrents
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Repartition par plan + taux de succes */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Repartition par plan */}
        <Card>
          <CardHeader>
            <CardTitle>Repartition par plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(["FREE", "PRO", "AGENCY"] as const).map((plan) => {
                const count = planCounts[plan]
                const percentage = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0
                const planConfig = PLANS[plan]

                return (
                  <div key={plan} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{planConfig.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {planConfig.price === 0 ? "Gratuit" : `${planConfig.price} EUR/mois`}
                        </Badge>
                      </div>
                      <span className="text-muted-foreground">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className={
                          plan === "FREE"
                            ? "h-full rounded-full bg-gray-400 transition-all"
                            : plan === "PRO"
                              ? "h-full rounded-full bg-violet-500 transition-all"
                              : "h-full rounded-full bg-amber-500 transition-all"
                        }
                        style={{ width: `${Math.max(percentage, 2)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Statistiques publications */}
        <Card>
          <CardHeader>
            <CardTitle>Publications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total publiees</span>
                <span className="font-medium text-green-600">{publishedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total echouees</span>
                <span className="font-medium text-red-600">{failedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Taux de succes</span>
                <span className="font-medium">
                  {publishedCount + failedCount > 0
                    ? `${Math.round((publishedCount / (publishedCount + failedCount)) * 100)}%`
                    : "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Connexions actives</span>
                <span className="font-medium">{activeConnections}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Derniers utilisateurs inscrits */}
      <Card>
        <CardHeader>
          <CardTitle>Derniers utilisateurs</CardTitle>
          <CardAction>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/admin/users">
                Tout voir
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Utilisateur</th>
                  <th className="pb-3 pr-4 font-medium">Plan</th>
                  <th className="pb-3 pr-4 font-medium">Clients</th>
                  <th className="pb-3 pr-4 font-medium">Publications</th>
                  <th className="pb-3 font-medium">Connexions</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-3 pr-4">
                      <div>
                        <p className="font-medium">{u.name ?? "Sans nom"}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge
                        className={
                          u.plan === "AGENCY"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                            : u.plan === "PRO"
                              ? "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        }
                      >
                        {PLANS[u.plan as PlanType]?.name ?? u.plan}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">{u._count.clients}</td>
                    <td className="py-3 pr-4">{u._count.publications}</td>
                    <td className="py-3">{u._count.platformConnections}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
