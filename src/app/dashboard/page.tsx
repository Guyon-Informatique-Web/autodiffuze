// Page d'accueil du dashboard avec statistiques dynamiques
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { format, formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import {
  PenSquare,
  FileText,
  CalendarClock,
  Link2,
  Sparkles,
  AlertTriangle,
  XCircle,
  ArrowRight,
} from "lucide-react"

import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPlanLimits, type PlanType } from "@/config/plans"
import { PLATFORM_CONFIG, type PlatformKey } from "@/config/platforms"

import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

import type { PublicationStatus, PlatformType } from "@prisma/client"

export const metadata = {
  title: "Dashboard",
}

// Configuration des couleurs de statut pour les badges
const STATUS_CONFIG: Record<PublicationStatus, { label: string; className: string }> = {
  DRAFT: {
    label: "Brouillon",
    className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  SCHEDULED: {
    label: "Planifiee",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
  PUBLISHING: {
    label: "En cours",
    className: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  },
  PUBLISHED: {
    label: "Publiee",
    className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  },
  PARTIAL: {
    label: "Partielle",
    className: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  },
  FAILED: {
    label: "Echouee",
    className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  },
}

// Icone de plateforme avec sa couleur
function PlatformIcon({ platform }: { platform: PlatformType }) {
  const config = PLATFORM_CONFIG[platform as PlatformKey]
  if (!config) return null

  return (
    <Image
      src={config.icon}
      alt={config.name}
      width={16}
      height={16}
      className="inline-block"
      title={config.name}
    />
  )
}

// Tronque un texte a une longueur maximale
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + "..."
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const now = new Date()
  const planLimits = getPlanLimits(user.plan as PlanType)

  // Debut du mois courant pour le comptage des publications
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Date limite pour les publications echouees (7 derniers jours)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Requetes paralleles pour les donnees du dashboard
  const [
    publicationsThisMonth,
    scheduledCount,
    activeConnectionsCount,
    expiredConnections,
    failedPublications,
    recentPublications,
    scheduledPublications,
  ] = await Promise.all([
    // Publications creees ce mois-ci
    prisma.publication.count({
      where: {
        userId: user.id,
        createdAt: { gte: startOfMonth },
      },
    }),

    // Publications planifiees en attente
    prisma.publication.count({
      where: {
        userId: user.id,
        status: "SCHEDULED",
      },
    }),

    // Plateformes connectees actives
    prisma.platformConnection.count({
      where: {
        userId: user.id,
        isActive: true,
      },
    }),

    // Connexions avec token expire
    prisma.platformConnection.findMany({
      where: {
        userId: user.id,
        isActive: true,
        tokenExpiresAt: { lte: now },
      },
      include: {
        client: { select: { name: true } },
      },
    }),

    // Publications echouees recentes (7 derniers jours)
    prisma.publication.findMany({
      where: {
        userId: user.id,
        status: "FAILED",
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        id: true,
        title: true,
        baseContent: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),

    // 5 dernieres publications (toutes)
    prisma.publication.findMany({
      where: { userId: user.id },
      include: {
        client: { select: { name: true } },
        platformPublications: {
          include: {
            platformConnection: {
              select: { platform: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),

    // 5 prochaines publications planifiees
    prisma.publication.findMany({
      where: {
        userId: user.id,
        status: "SCHEDULED",
        scheduledAt: { gte: now },
      },
      include: {
        client: { select: { name: true } },
        platformPublications: {
          include: {
            platformConnection: {
              select: { platform: true },
            },
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
      take: 5,
    }),
  ])

  // Calcul des credits IA restants
  const aiCreditsRemaining = Math.max(
    0,
    planLimits.aiGenerationsPerMonth - user.aiCreditsUsed
  )

  // Verification s'il y a des alertes a afficher
  const hasAlerts = expiredConnections.length > 0 || failedPublications.length > 0

  return (
    <div className="space-y-6">
      {/* En-tete */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            {user.name
              ? `Bienvenue, ${user.name}`
              : "Bienvenue sur Autodiffuze"}
          </p>
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

      {/* Alertes */}
      {hasAlerts && (
        <div className="space-y-3">
          {expiredConnections.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>
                {expiredConnections.length === 1
                  ? "Connexion expiree"
                  : `${expiredConnections.length} connexions expirees`}
              </AlertTitle>
              <AlertDescription>
                {expiredConnections.map((conn) => {
                  const platformConfig =
                    PLATFORM_CONFIG[conn.platform as PlatformKey]
                  return (
                    <span key={conn.id} className="block">
                      {platformConfig?.name ?? conn.platform} ({conn.client.name})
                      — reconnexion necessaire
                    </span>
                  )
                })}
                <Button variant="link" asChild className="mt-1 h-auto p-0">
                  <Link href="/dashboard/platforms">
                    Gerer les connexions
                  </Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {failedPublications.length > 0 && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>
                {failedPublications.length === 1
                  ? "Publication echouee"
                  : `${failedPublications.length} publications echouees`}
              </AlertTitle>
              <AlertDescription>
                {failedPublications.map((pub) => (
                  <span key={pub.id} className="block">
                    <Link
                      href={`/dashboard/publications/${pub.id}`}
                      className="underline hover:no-underline"
                    >
                      {truncateText(pub.title ?? pub.baseContent, 60)}
                    </Link>
                    {" — "}
                    {formatDistanceToNow(pub.createdAt, {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </span>
                ))}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Barre de stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Publications ce mois
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publicationsThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              sur {planLimits.maxPublicationsPerMonth} disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Planifiees
            </CardTitle>
            <CalendarClock className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledCount}</div>
            <p className="text-xs text-muted-foreground">
              {scheduledCount <= 1
                ? "publication en attente"
                : "publications en attente"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Plateformes
            </CardTitle>
            <Link2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeConnectionsCount}</div>
            <p className="text-xs text-muted-foreground">connectees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Credits IA
            </CardTitle>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiCreditsRemaining}</div>
            <p className="text-xs text-muted-foreground">
              sur {planLimits.aiGenerationsPerMonth} restants ce mois
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal : publications recentes + planifiees */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Publications recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Publications recentes</CardTitle>
            {recentPublications.length > 0 && (
              <CardAction>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/publications">
                    Tout voir
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardAction>
            )}
          </CardHeader>
          <CardContent>
            {recentPublications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Aucune publication pour le moment.
                </p>
                <Button variant="link" asChild className="mt-2">
                  <Link href="/dashboard/create">
                    Creer votre premiere publication
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentPublications.map((pub) => {
                  const statusConfig = STATUS_CONFIG[pub.status]
                  // Extraire les plateformes uniques ciblees
                  const platforms = [
                    ...new Set(
                      pub.platformPublications.map(
                        (pp) => pp.platformConnection.platform
                      )
                    ),
                  ]

                  return (
                    <Link
                      key={pub.id}
                      href={`/dashboard/publications/${pub.id}`}
                      className="flex items-start justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {truncateText(pub.title ?? pub.baseContent, 60)}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{pub.client.name}</span>
                          <span>-</span>
                          <span>
                            {format(pub.createdAt, "d MMM yyyy", {
                              locale: fr,
                            })}
                          </span>
                        </div>
                        {platforms.length > 0 && (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            {platforms.map((platform) => (
                              <PlatformIcon
                                key={platform}
                                platform={platform}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <Badge
                        className={statusConfig.className}
                      >
                        {statusConfig.label}
                      </Badge>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Publications planifiees */}
        <Card>
          <CardHeader>
            <CardTitle>Publications planifiees</CardTitle>
            {scheduledPublications.length > 0 && (
              <CardAction>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/scheduled">
                    Tout voir
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardAction>
            )}
          </CardHeader>
          <CardContent>
            {scheduledPublications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarClock className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Aucune publication planifiee.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {scheduledPublications.map((pub) => {
                  // Extraire les plateformes uniques ciblees
                  const platforms = [
                    ...new Set(
                      pub.platformPublications.map(
                        (pp) => pp.platformConnection.platform
                      )
                    ),
                  ]

                  return (
                    <Link
                      key={pub.id}
                      href={`/dashboard/publications/${pub.id}`}
                      className="flex items-start justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {truncateText(pub.title ?? pub.baseContent, 60)}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{pub.client.name}</span>
                          {pub.scheduledAt && (
                            <>
                              <span>-</span>
                              <span>
                                {format(pub.scheduledAt, "d MMM yyyy 'a' HH:mm", {
                                  locale: fr,
                                })}
                              </span>
                            </>
                          )}
                        </div>
                        {platforms.length > 0 && (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            {platforms.map((platform) => (
                              <PlatformIcon
                                key={platform}
                                platform={platform}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        Planifiee
                      </Badge>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
