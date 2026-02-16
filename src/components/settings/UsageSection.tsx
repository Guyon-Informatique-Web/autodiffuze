"use client"

// Section affichant l'usage du mois avec barres de progression colorees
import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, FileText, Sparkles, Link2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PlanType } from "@/config/plans"

// Structure retournee par l'API /api/usage (correspond a PlanUsage)
interface UsageData {
  usage: {
    clients: { current: number; max: number }
    publications: { current: number; max: number }
    aiCredits: { used: number; max: number; resetsAt: string | null }
    platforms: { current: number; max: number }
    scheduling: boolean
    templates: boolean
  }
  plan: { type: PlanType; name: string }
  limits: {
    maxClients: number
    maxPublicationsPerMonth: number
    aiGenerationsPerMonth: number
    maxPlatforms: number
  }
}

// Determine la couleur en fonction du pourcentage d'utilisation
function getProgressColor(percentage: number): string {
  if (percentage >= 80) return "text-red-500 [&_[data-slot=progress-indicator]]:bg-red-500"
  if (percentage >= 50) return "text-orange-500 [&_[data-slot=progress-indicator]]:bg-orange-500"
  return "text-green-500 [&_[data-slot=progress-indicator]]:bg-green-500"
}

interface UsageBarProps {
  label: string
  used: number
  limit: number
  icon: React.ReactNode
}

function UsageBar({ label, used, limit, icon }: UsageBarProps) {
  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {used} / {limit}
        </span>
      </div>
      <Progress
        value={percentage}
        className={cn("h-2", getProgressColor(percentage))}
      />
    </div>
  )
}

export function UsageSection() {
  const [data, setData] = useState<UsageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const response = await fetch("/api/usage")
        if (response.ok) {
          const usageData: UsageData = await response.json()
          setData(usageData)
        }
      } catch {
        console.error("Erreur chargement usage")
      } finally {
        setIsLoading(false)
      }
    }

    void fetchUsage()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage du mois</CardTitle>
        <CardDescription>
          Votre consommation pour la periode en cours
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        ) : data ? (
          <div className="space-y-6">
            <UsageBar
              label="Clients"
              used={data.usage.clients.current}
              limit={data.usage.clients.max}
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
            />
            <UsageBar
              label="Publications ce mois"
              used={data.usage.publications.current}
              limit={data.usage.publications.max}
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
            />
            <UsageBar
              label="Credits IA"
              used={data.usage.aiCredits.used}
              limit={data.usage.aiCredits.max}
              icon={<Sparkles className="h-4 w-4 text-muted-foreground" />}
            />
            <UsageBar
              label="Plateformes connectees"
              used={data.usage.platforms.current}
              limit={data.usage.platforms.max}
              icon={<Link2 className="h-4 w-4 text-muted-foreground" />}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Impossible de charger les donnees d&apos;utilisation
          </p>
        )}
      </CardContent>
    </Card>
  )
}
