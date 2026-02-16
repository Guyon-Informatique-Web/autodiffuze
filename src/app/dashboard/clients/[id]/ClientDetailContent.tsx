"use client"

// Composant client pour le detail d'un client avec mode edition
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ClientForm } from "@/components/dashboard/clients/ClientForm"
import { DeleteClientDialog } from "@/components/dashboard/clients/DeleteClientDialog"
import { ConnectPlatformDialog } from "@/components/dashboard/platforms/ConnectPlatformDialog"
import {
  ArrowLeft,
  Pencil,
  X,
  Link2,
  FileText,
  Globe,
  Building2,
  Users,
  BarChart3,
} from "lucide-react"
import type { CreateClientInput } from "@/lib/validations/client"

// Types serialises (dates en string)
interface SerializedPlatformConnection {
  id: string
  userId: string
  clientId: string
  platform: string
  platformAccountId: string
  platformAccountName: string
  platformPageId: string | null
  accessToken: string
  refreshToken: string | null
  tokenExpiresAt: string | null
  isActive: boolean
  lastUsedAt: string | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

interface SerializedPublication {
  id: string
  userId: string
  clientId: string
  title: string | null
  baseContent: string
  contentType: string
  mediaUrls: string[]
  mediaTypes: string[]
  status: string
  scheduledAt: string | null
  publishedAt: string | null
  aiGenerated: boolean
  aiPrompt: string | null
  templateId: string | null
  createdAt: string
  updatedAt: string
}

interface SerializedClient {
  id: string
  userId: string
  name: string
  description: string | null
  logoUrl: string | null
  website: string | null
  industry: string | null
  tone: string | null
  targetAudience: string | null
  createdAt: string
  updatedAt: string
  platformConnections: SerializedPlatformConnection[]
  publications: SerializedPublication[]
  _count: {
    publications: number
    platformConnections: number
  }
}

interface PlatformStat {
  platform: string
  accountName: string
  count: number
}

interface ClientDetailContentProps {
  client: SerializedClient
  platformStats: PlatformStat[]
}

// Correspondance des noms de plateformes pour l'affichage
const PLATFORM_LABELS: Record<string, string> = {
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  LINKEDIN: "LinkedIn",
  X: "X (Twitter)",
  TIKTOK: "TikTok",
}

// Correspondance des statuts de publication
const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  SCHEDULED: "Planifiee",
  PUBLISHING: "En cours",
  PUBLISHED: "Publiee",
  PARTIAL: "Partielle",
  FAILED: "Echouee",
}

// Couleurs des badges de statut
const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "secondary",
  SCHEDULED: "outline",
  PUBLISHING: "default",
  PUBLISHED: "default",
  PARTIAL: "secondary",
  FAILED: "destructive",
}

export function ClientDetailContent({
  client,
  platformStats,
}: ClientDetailContentProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleUpdate = async (data: CreateClientInput) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error ?? "Erreur lors de la modification")
        return
      }

      toast.success("Client modifie avec succes")
      setIsEditing(false)
      router.refresh()
    } catch {
      toast.error("Une erreur est survenue. Veuillez reessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const result = await response.json()
        toast.error(result.error ?? "Erreur lors de la suppression")
        return
      }

      toast.success("Client supprime avec succes")
      router.push("/dashboard/clients")
      router.refresh()
    } catch {
      toast.error("Une erreur est survenue. Veuillez reessayer.")
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tete */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/clients">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-blue-100 dark:from-violet-950 dark:to-blue-950">
              <Building2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{client.name}</h1>
              {client.industry && (
                <Badge variant="secondary" className="mt-0.5">
                  {client.industry}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Modifier
            </Button>
          )}
          {isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
              <X className="mr-2 h-4 w-4" />
              Annuler
            </Button>
          )}
          <DeleteClientDialog
            clientName={client.name}
            onConfirm={handleDelete}
          />
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950">
              <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{client._count.publications}</p>
              <p className="text-sm text-muted-foreground">
                publication{client._count.publications !== 1 ? "s" : ""}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
              <Link2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {client._count.platformConnections}
              </p>
              <p className="text-sm text-muted-foreground">
                plateforme{client._count.platformConnections !== 1 ? "s" : ""}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
              <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{platformStats.length}</p>
              <p className="text-sm text-muted-foreground">
                compte{platformStats.length !== 1 ? "s" : ""} connecte
                {platformStats.length !== 1 ? "s" : ""}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Informations du client / Mode edition */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {isEditing ? "Modifier le client" : "Informations"}
            </CardTitle>
            {!isEditing && (
              <CardDescription>
                Details et parametres du client
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <ClientForm
                initialData={{
                  name: client.name,
                  description: client.description ?? "",
                  website: client.website ?? "",
                  industry: client.industry ?? "",
                  tone: client.tone ?? "",
                  targetAudience: client.targetAudience ?? "",
                }}
                onSubmit={handleUpdate}
                isLoading={isLoading}
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {client.description && (
                  <div className="sm:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Description
                    </p>
                    <p className="mt-1">{client.description}</p>
                  </div>
                )}
                {client.website && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Site web
                    </p>
                    <a
                      href={client.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 flex items-center gap-1 text-violet-600 hover:underline dark:text-violet-400"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      {client.website}
                    </a>
                  </div>
                )}
                {client.tone && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Ton de communication
                    </p>
                    <p className="mt-1">{client.tone}</p>
                  </div>
                )}
                {client.targetAudience && (
                  <div className="sm:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Audience cible
                    </p>
                    <p className="mt-1">{client.targetAudience}</p>
                  </div>
                )}
                {!client.description &&
                  !client.website &&
                  !client.tone &&
                  !client.targetAudience && (
                    <p className="text-sm text-muted-foreground sm:col-span-2">
                      Aucune information supplementaire renseignee.{" "}
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-violet-600 hover:underline dark:text-violet-400"
                      >
                        Completer le profil
                      </button>
                    </p>
                  )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plateformes connectees */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Plateformes connectees
            </CardTitle>
          </CardHeader>
          <CardContent>
            {client.platformConnections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">
                  <Link2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Aucune plateforme connectee pour le moment.
                </p>
                <ConnectPlatformDialog clientId={client.id}>
                  <Button variant="link" className="mt-2">
                    Connecter une plateforme
                  </Button>
                </ConnectPlatformDialog>
              </div>
            ) : (
              <div className="space-y-3">
                {client.platformConnections.map((conn) => (
                  <div
                    key={conn.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                        <span className="text-xs font-bold">
                          {conn.platform.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {PLATFORM_LABELS[conn.platform] ?? conn.platform}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {conn.platformAccountName}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={conn.isActive ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {conn.isActive ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                ))}
                <Separator className="my-2" />
                <ConnectPlatformDialog clientId={client.id}>
                  <Button variant="outline" size="sm" className="w-full">
                    <Link2 className="mr-2 h-4 w-4" />
                    Connecter une plateforme
                  </Button>
                </ConnectPlatformDialog>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Publications recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Publications recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {client.publications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-950">
                  <FileText className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Aucune publication pour ce client.
                </p>
                <Button variant="link" asChild className="mt-2">
                  <Link href="/dashboard/create">
                    Creer une publication
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {client.publications.map((pub) => (
                  <div
                    key={pub.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {pub.title ?? pub.baseContent.slice(0, 60)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(pub.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <Badge variant={STATUS_VARIANTS[pub.status] ?? "secondary"} className="ml-2 shrink-0 text-xs">
                      {STATUS_LABELS[pub.status] ?? pub.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Repartition par plateforme */}
        {platformStats.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Repartition par plateforme
              </CardTitle>
              <CardDescription>
                Nombre de publications par compte connecte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {platformStats.map((stat, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {PLATFORM_LABELS[stat.platform] ?? stat.platform}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {stat.accountName}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {stat.count} publication{stat.count !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
