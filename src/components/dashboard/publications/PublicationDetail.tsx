"use client"

// Composant client pour le detail complet d'une publication
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Trash2,
  Send,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
  FileText,
  ImageIcon,
  Video,
  Calendar,
  Clock,
  User,
  LayoutTemplate,
  Hash,
} from "lucide-react"
import { PLATFORM_CONFIG, type PlatformKey } from "@/config/platforms"

// -- Types serialises (dates en string pour passage Server -> Client) --

interface SerializedPlatformConnection {
  platform: string
  platformAccountName: string
  platformAccountId: string
}

interface SerializedPlatformPublication {
  id: string
  publicationId: string
  platformConnectionId: string
  adaptedContent: string
  hashtags: string[]
  mediaUrls: string[]
  status: string
  platformPostId: string | null
  platformPostUrl: string | null
  errorMessage: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  platformConnection: SerializedPlatformConnection
}

interface SerializedClient {
  name: string
  logoUrl: string | null
}

interface SerializedTemplate {
  id: string
  name: string
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
  client: SerializedClient
  template: SerializedTemplate | null
  platformPublications: SerializedPlatformPublication[]
}

interface PublicationDetailProps {
  publication: SerializedPublication
}

// -- Labels et couleurs de statut --

const PUBLICATION_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  SCHEDULED: "Planifiee",
  PUBLISHING: "En cours",
  PUBLISHED: "Publiee",
  PARTIAL: "Partielle",
  FAILED: "Echouee",
}

const PUBLICATION_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  PUBLISHING: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300",
  PUBLISHED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  PARTIAL: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
}

const PLATFORM_STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  PUBLISHING: "Publication en cours",
  PUBLISHED: "Publiee",
  FAILED: "Echouee",
  SKIPPED: "Ignoree",
}

const PLATFORM_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  PUBLISHING: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300",
  PUBLISHED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  SKIPPED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  POST: "Post",
  STORY: "Story",
  REEL: "Reel",
  ARTICLE: "Article",
  THREAD: "Thread",
}

// -- Helpers --

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function isImageType(mediaType: string): boolean {
  return mediaType.startsWith("image/")
}

function getMediaFileName(url: string): string {
  const parts = url.split("/")
  return parts[parts.length - 1] ?? "fichier"
}

// -- Composant principal --

export function PublicationDetail({ publication }: PublicationDetailProps) {
  const router = useRouter()
  const [isPublishing, setIsPublishing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  // Tableau pour gerer les toggles d'affichage du contenu adapte par plateforme
  const [expandedPlatforms, setExpandedPlatforms] = useState<Record<string, boolean>>({})

  const togglePlatformContent = (platformPubId: string) => {
    setExpandedPlatforms((prev) => ({
      ...prev,
      [platformPubId]: !prev[platformPubId],
    }))
  }

  // Publier ou retenter la publication
  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      const response = await fetch(`/api/publications/${publication.id}/publish`, {
        method: "POST",
      })

      const result = await response.json() as { error?: string }

      if (!response.ok) {
        toast.error(result.error ?? "Erreur lors de la publication")
        return
      }

      toast.success("Publication lancee avec succes")
      router.refresh()
    } catch {
      toast.error("Une erreur est survenue. Veuillez reessayer.")
    } finally {
      setIsPublishing(false)
    }
  }

  // Supprimer la publication
  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/publications/${publication.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const result = await response.json() as { error?: string }
        toast.error(result.error ?? "Erreur lors de la suppression")
        return
      }

      toast.success("Publication supprimee avec succes")
      router.push("/dashboard/publications")
      router.refresh()
    } catch {
      toast.error("Une erreur est survenue. Veuillez reessayer.")
    } finally {
      setIsDeleting(false)
    }
  }

  const canPublish = publication.status === "DRAFT" || publication.status === "SCHEDULED"
  const canRetry = publication.status === "FAILED" || publication.status === "PARTIAL"

  return (
    <div className="space-y-6">
      {/* -- En-tete -- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild className="mt-1 shrink-0">
            <Link href="/dashboard/publications">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">
                {publication.title ?? "Publication sans titre"}
              </h1>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  PUBLICATION_STATUS_COLORS[publication.status] ?? ""
                }`}
              >
                {PUBLICATION_STATUS_LABELS[publication.status] ?? publication.status}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Creee le {formatDate(publication.createdAt)}
              </span>
              {publication.publishedAt && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Publiee le {formatDateTime(publication.publishedAt)}
                </span>
              )}
              {publication.scheduledAt && publication.status === "SCHEDULED" && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Planifiee le {formatDateTime(publication.scheduledAt)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* -- Informations -- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Informations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Client */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950">
                {publication.client.logoUrl ? (
                  <Image
                    src={publication.client.logoUrl}
                    alt={publication.client.name}
                    width={24}
                    height={24}
                    className="rounded"
                  />
                ) : (
                  <User className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Client</p>
                <p className="font-medium">{publication.client.name}</p>
              </div>
            </div>

            {/* Type de contenu */}
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Type de contenu
              </p>
              <Badge variant="secondary" className="mt-1">
                {CONTENT_TYPE_LABELS[publication.contentType] ?? publication.contentType}
              </Badge>
            </div>

            {/* Template */}
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Template utilise
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <LayoutTemplate className="h-4 w-4 text-muted-foreground" />
                {publication.template ? (
                  <Link
                    href={`/dashboard/templates/${publication.template.id}`}
                    className="text-violet-600 hover:underline dark:text-violet-400"
                  >
                    {publication.template.name}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </div>
            </div>

            {/* Genere par IA */}
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Genere par IA
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                <span>{publication.aiGenerated ? "Oui" : "Non"}</span>
              </div>
              {publication.aiGenerated && publication.aiPrompt && (
                <p className="mt-1 rounded-md bg-muted p-2 text-sm text-muted-foreground">
                  {publication.aiPrompt}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* -- Contenu de base -- */}
      <Card>
        <CardHeader>
          <CardTitle>Contenu de base</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap rounded-md border bg-muted/50 p-4 text-sm leading-relaxed">
            {publication.baseContent}
          </div>
        </CardContent>
      </Card>

      {/* -- Medias -- */}
      {publication.mediaUrls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Medias ({publication.mediaUrls.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {publication.mediaUrls.map((url, index) => {
                const mediaType = publication.mediaTypes[index] ?? ""
                const isImage = isImageType(mediaType)

                return (
                  <div
                    key={`${url}-${index}`}
                    className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
                  >
                    {isImage ? (
                      <Image
                        src={url}
                        alt={`Media ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 p-3">
                        <Video className="h-8 w-8 text-muted-foreground" />
                        <p className="text-center text-xs text-muted-foreground truncate max-w-full">
                          {getMediaFileName(url)}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* -- Statut par plateforme -- */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">
          Statut par plateforme ({publication.platformPublications.length})
        </h2>

        {publication.platformPublications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Aucune plateforme cible pour cette publication.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {publication.platformPublications.map((pp) => {
              const platformKey = pp.platformConnection.platform as PlatformKey
              const platformConfig = PLATFORM_CONFIG[platformKey]
              const isExpanded = expandedPlatforms[pp.id] ?? false

              return (
                <Card key={pp.id}>
                  <CardContent>
                    {/* En-tete de la plateforme */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                          style={{
                            backgroundColor: platformConfig
                              ? `${platformConfig.color}15`
                              : undefined,
                          }}
                        >
                          <span
                            className="text-sm font-bold"
                            style={{
                              color: platformConfig?.color ?? undefined,
                            }}
                          >
                            {platformConfig?.name.charAt(0) ?? platformKey.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p
                            className="font-medium"
                            style={{
                              color: platformConfig?.color ?? undefined,
                            }}
                          >
                            {platformConfig?.name ?? platformKey}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            @{pp.platformConnection.platformAccountName}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          PLATFORM_STATUS_COLORS[pp.status] ?? ""
                        }`}
                      >
                        {PLATFORM_STATUS_LABELS[pp.status] ?? pp.status}
                      </span>
                    </div>

                    {/* Contenu selon le statut */}
                    <div className="mt-4 space-y-3">
                      {/* PUBLISHED : lien et date */}
                      {pp.status === "PUBLISHED" && (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                          {pp.platformPostUrl && (
                            <a
                              href={pp.platformPostUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-violet-600 hover:underline dark:text-violet-400"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Voir le post publie
                            </a>
                          )}
                          {pp.publishedAt && (
                            <span className="text-muted-foreground">
                              Publiee le {formatDateTime(pp.publishedAt)}
                            </span>
                          )}
                        </div>
                      )}

                      {/* FAILED : message d'erreur */}
                      {pp.status === "FAILED" && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Echec de la publication</AlertTitle>
                          <AlertDescription>
                            {pp.errorMessage ?? "Une erreur inconnue est survenue."}
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* SKIPPED : explication */}
                      {pp.status === "SKIPPED" && (
                        <p className="text-sm text-muted-foreground">
                          Cette plateforme a ete ignoree lors de la publication.
                        </p>
                      )}

                      <Separator />

                      {/* Contenu adapte (toggle) */}
                      <div>
                        <button
                          type="button"
                          onClick={() => togglePlatformContent(pp.id)}
                          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          Contenu adapte
                        </button>
                        {isExpanded && (
                          <div className="mt-2 whitespace-pre-wrap rounded-md border bg-muted/50 p-3 text-sm leading-relaxed">
                            {pp.adaptedContent}
                          </div>
                        )}
                      </div>

                      {/* Hashtags */}
                      {pp.hashtags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          {pp.hashtags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* -- Actions en bas -- */}
      <Separator />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {/* Publier maintenant (brouillon ou planifiee) */}
          {canPublish && (
            <Button onClick={handlePublish} disabled={isPublishing}>
              {isPublishing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Publier maintenant
            </Button>
          )}

          {/* Modifier (brouillon) */}
          {publication.status === "DRAFT" && (
            <Button variant="outline" asChild>
              <Link href="/dashboard/create">Modifier</Link>
            </Button>
          )}

          {/* Retenter (echec ou partielle) */}
          {canRetry && (
            <Button
              variant="outline"
              onClick={handlePublish}
              disabled={isPublishing}
            >
              {isPublishing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Retenter la publication
            </Button>
          )}
        </div>

        {/* Supprimer */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Supprimer la publication</DialogTitle>
              <DialogDescription>
                Etes-vous sur de vouloir supprimer cette publication ? Cette action
                est irreversible. Toutes les publications de plateforme associees
                seront egalement supprimees.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Supprimer definitivement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
