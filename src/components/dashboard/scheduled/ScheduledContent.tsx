"use client"

// Contenu principal de la page des publications planifiees
// Gere le toggle entre vue calendrier et vue liste
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarClock, CalendarDays, List, PenSquare } from "lucide-react"
import Link from "next/link"
import { CalendarView } from "@/components/dashboard/scheduled/CalendarView"
import { ListView } from "@/components/dashboard/scheduled/ListView"
import type { PlatformType } from "@prisma/client"

// Type serialise pour les publications passees depuis le Server Component
export interface SerializedPublication {
  id: string
  title: string | null
  baseContent: string
  scheduledAt: string | null
  createdAt: string
  client: {
    id: string
    name: string
    logoUrl: string | null
  }
  platforms: Array<{
    id: string
    platform: PlatformType
    accountName: string
  }>
}

type ViewMode = "calendar" | "list"

interface ScheduledContentProps {
  publications: SerializedPublication[]
}

export function ScheduledContent({ publications }: ScheduledContentProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("calendar")

  return (
    <div className="space-y-6">
      {/* En-tete avec toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Publications planifiees</h1>
          <p className="text-muted-foreground">
            {publications.length === 0
              ? "Aucune publication en attente"
              : `${publications.length} publication${publications.length > 1 ? "s" : ""} en attente`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle vue calendrier / liste */}
          <div className="flex items-center rounded-lg border bg-muted p-1">
            <Button
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("calendar")}
              className={
                viewMode === "calendar"
                  ? "bg-background text-foreground shadow-sm hover:bg-background"
                  : "hover:bg-transparent"
              }
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              Calendrier
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={
                viewMode === "list"
                  ? "bg-background text-foreground shadow-sm hover:bg-background"
                  : "hover:bg-transparent"
              }
            >
              <List className="mr-2 h-4 w-4" />
              Liste
            </Button>
          </div>
          <Button
            asChild
            className="bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-700 hover:to-blue-600"
          >
            <Link href="/dashboard/create">
              <PenSquare className="mr-2 h-4 w-4" />
              Nouvelle publication
            </Link>
          </Button>
        </div>
      </div>

      {/* Contenu selon la vue ou etat vide */}
      {publications.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-950">
                <CalendarClock className="h-8 w-8 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                Aucune publication planifiee
              </h3>
              <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                Planifiez vos publications pour qu&apos;elles soient
                automatiquement publiees au moment ideal.
              </p>
              <Button
                asChild
                className="bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-700 hover:to-blue-600"
              >
                <Link href="/dashboard/create">
                  <PenSquare className="mr-2 h-4 w-4" />
                  Creer une publication
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === "calendar" ? (
        <CalendarView publications={publications} />
      ) : (
        <ListView publications={publications} />
      )}
    </div>
  )
}
