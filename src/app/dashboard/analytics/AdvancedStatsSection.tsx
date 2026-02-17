"use client"

// Section des statistiques avancees (plan AGENCY uniquement)
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Sparkles } from "lucide-react"

interface AdvancedStats {
  trends: Array<{
    month: string
    total: number
    published: number
    failed: number
    aiGenerated: number
  }>
  contentTypeBreakdown: Array<{ contentType: string; count: number }>
  aiUsagePercent: number
  totalPublications: number
  aiPublications: number
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  POST: "Post",
  STORY: "Story",
  REEL: "Reel",
  ARTICLE: "Article",
  THREAD: "Thread",
}

const CONTENT_TYPE_COLORS: Record<string, string> = {
  POST: "#7c3aed",
  STORY: "#e4405f",
  REEL: "#f59e0b",
  ARTICLE: "#3b82f6",
  THREAD: "#14b8a6",
}

// Formate "2026-02" en "Fev 2026"
function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split("-")
  const months = [
    "Jan", "Fev", "Mar", "Avr", "Mai", "Juin",
    "Juil", "Aout", "Sep", "Oct", "Nov", "Dec",
  ]
  return `${months[Number(month) - 1]} ${year}`
}

export function AdvancedStatsSection() {
  const [stats, setStats] = useState<AdvancedStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/analytics/stats?mode=advanced")
        if (res.status === 403) {
          setError("Fonctionnalite reservee au plan Agence")
          return
        }
        if (!res.ok) return
        const data = await res.json()
        setStats(data.advanced)
      } catch (err) {
        console.error("Erreur chargement stats avancees :", err)
        setError("Erreur de chargement")
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-0">
            <Skeleton className="h-72 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-0">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12 text-center text-muted-foreground">{error}</div>
    )
  }

  if (!stats) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Aucune donnee disponible
      </div>
    )
  }

  // Donnees pour le graphique des tendances
  const trendsData = stats.trends.map((t) => ({
    ...t,
    label: formatMonth(t.month),
  }))

  // Donnees pour la repartition par type de contenu
  const contentData = stats.contentTypeBreakdown.map((c) => ({
    name: CONTENT_TYPE_LABELS[c.contentType] ?? c.contentType,
    count: c.count,
    fill: CONTENT_TYPE_COLORS[c.contentType] ?? "#6b7280",
  }))

  return (
    <div className="space-y-6">
      {/* Utilisation IA */}
      <Card>
        <CardContent className="flex items-center gap-4 pt-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950">
            <Sparkles className="h-6 w-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Utilisation de l&apos;IA
            </p>
            <p className="text-2xl font-bold">{stats.aiUsagePercent}%</p>
            <p className="text-xs text-muted-foreground">
              {stats.aiPublications} publications generees par IA sur{" "}
              {stats.totalPublications} au total
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tendances 6 mois (LineChart) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tendances sur 6 mois</CardTitle>
        </CardHeader>
        <CardContent>
          {trendsData.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Pas encore assez de donnees
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={trendsData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                />
                <Tooltip />
                <Legend
                  formatter={(value) => {
                    const labels: Record<string, string> = {
                      total: "Total",
                      published: "Publies",
                      failed: "Echoues",
                      aiGenerated: "IA",
                    }
                    return labels[value] ?? value
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="published"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="failed"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="aiGenerated"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Repartition par type de contenu (BarChart) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Repartition par type de contenu
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contentData.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucune donnee disponible
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={contentData}>
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
                <Tooltip />
                <Bar dataKey="count" name="Publications" radius={[4, 4, 0, 0]}>
                  {contentData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
