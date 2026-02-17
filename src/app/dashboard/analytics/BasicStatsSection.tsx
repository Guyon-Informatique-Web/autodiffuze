"use client"

// Section des statistiques basiques (tous plans)
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { FileText, TrendingUp, Activity } from "lucide-react"

interface BasicStats {
  publishedThisMonth: number
  statusBreakdown: Array<{ status: string; count: number }>
  platformSuccess: Array<{
    platform: string
    total: number
    success: number
    rate: number
  }>
  recentActivity: number
}

// Couleurs pour les statuts de publication
const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#94a3b8",
  SCHEDULED: "#3b82f6",
  PUBLISHING: "#a855f7",
  PUBLISHED: "#22c55e",
  PARTIAL: "#f59e0b",
  FAILED: "#ef4444",
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  SCHEDULED: "Planifie",
  PUBLISHING: "En cours",
  PUBLISHED: "Publie",
  PARTIAL: "Partiel",
  FAILED: "Echoue",
}

// Couleurs pour les plateformes
const PLATFORM_COLORS: Record<string, string> = {
  FACEBOOK: "#1877f2",
  INSTAGRAM: "#e4405f",
  LINKEDIN: "#0a66c2",
  X: "#14171a",
  TIKTOK: "#000000",
}

const PLATFORM_LABELS: Record<string, string> = {
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  LINKEDIN: "LinkedIn",
  X: "X (Twitter)",
  TIKTOK: "TikTok",
}

export function BasicStatsSection() {
  const [stats, setStats] = useState<BasicStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/analytics/stats?mode=basic")
        if (!res.ok) return
        const data = await res.json()
        setStats(data)
      } catch (err) {
        console.error("Erreur chargement stats :", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-0">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardContent className="pt-0">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-0">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Impossible de charger les statistiques.
      </div>
    )
  }

  // Calcul du total des publications
  const totalPubs = stats.statusBreakdown.reduce((sum, s) => sum + s.count, 0)

  // Donnees pour le graphique pie (statuts)
  const pieData = stats.statusBreakdown
    .filter((s) => s.count > 0)
    .map((s) => ({
      name: STATUS_LABELS[s.status] ?? s.status,
      value: s.count,
      color: STATUS_COLORS[s.status] ?? "#6b7280",
    }))

  // Donnees pour le graphique bar (plateformes)
  const barData = stats.platformSuccess.map((p) => ({
    name: PLATFORM_LABELS[p.platform] ?? p.platform,
    total: p.total,
    succes: p.success,
    taux: p.rate,
    fill: PLATFORM_COLORS[p.platform] ?? "#6b7280",
  }))

  return (
    <div className="space-y-6">
      {/* Cards metriques */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950">
              <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.publishedThisMonth}</p>
              <p className="text-sm text-muted-foreground">Ce mois-ci</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalPubs}</p>
              <p className="text-sm text-muted-foreground">Total publications</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
              <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.recentActivity}</p>
              <p className="text-sm text-muted-foreground">7 derniers jours</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Repartition par statut (Pie) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Repartition par statut</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucune donnee disponible
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name} (${value})`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Taux de succes par plateforme (Bar) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Succes par plateforme</CardTitle>
          </CardHeader>
          <CardContent>
            {barData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucune donnee disponible
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      value,
                      name === "total" ? "Total" : "Reussis",
                    ]}
                  />
                  <Legend
                    formatter={(value) =>
                      value === "total" ? "Total" : "Reussis"
                    }
                  />
                  <Bar dataKey="total" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="succes" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
