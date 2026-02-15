"use client"

// Carte individuelle d'une publication dans l'historique
// Affiche le titre, client, plateformes cibles avec indicateur de statut,
// la date et le statut global avec actions (voir, supprimer)
import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Eye,
  Trash2,
  Loader2,
  Check,
  X,
  Clock,
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { PLATFORM_CONFIG, type PlatformKey } from "@/config/platforms"
import type { PublicationStatus, PlatformPublishStatus, PlatformType } from "@prisma/client"

// Type pour une publication telle que retournee par l'API GET /api/publications
export interface PublicationData {
  id: string
  title: string | null
  baseContent: string
  status: PublicationStatus
  createdAt: string
  publishedAt: string | null
  scheduledAt: string | null
  client: {
    name: string
  }
  platformPublications: Array<{
    id: string
    status: PlatformPublishStatus
    platformPostUrl: string | null
    platformConnection: {
      platform: PlatformType
      platformAccountName: string
    }
  }>
}

// Configuration des couleurs et labels pour les statuts globaux
const STATUS_CONFIG: Record<
  PublicationStatus,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "Brouillon",
    className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  SCHEDULED: {
    label: "Planifie",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
  PUBLISHING: {
    label: "En cours",
    className:
      "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  },
  PUBLISHED: {
    label: "Publie",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  },
  PARTIAL: {
    label: "Partiel",
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  },
  FAILED: {
    label: "Echoue",
    className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  },
}

interface PublicationCardProps {
  publication: PublicationData
  onDeleted: () => void
}

export function PublicationCard({
  publication,
  onDeleted,
}: PublicationCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Obtenir le titre ou un extrait tronque a 80 caracteres
  function getLabel(): string {
    const text = publication.title ?? publication.baseContent
    return text.length > 80 ? text.slice(0, 80) + "..." : text
  }

  // Formater une date ISO en francais
  function formatDate(isoDate: string): string {
    const date = new Date(isoDate)
    return format(date, "d MMM yyyy 'a' HH:mm", { locale: fr })
  }

  // Obtenir la date la plus pertinente a afficher
  function getDisplayDate(): string {
    if (publication.publishedAt) {
      return formatDate(publication.publishedAt)
    }
    return formatDate(publication.createdAt)
  }

  // Confirmer la suppression
  async function handleDeleteConfirm() {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/publications/${publication.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Publication supprimee")
        setDeleteDialogOpen(false)
        onDeleted()
      } else {
        const data = (await response.json()) as { error: string }
        toast.error(data.error || "Echec de la suppression")
      }
    } catch {
      toast.error("Erreur de connexion au serveur")
    } finally {
      setIsDeleting(false)
    }
  }

  // Obtenir l'icone d'indicateur de statut pour une PlatformPublication
  function renderPlatformStatusIcon(status: PlatformPublishStatus) {
    switch (status) {
      case "PUBLISHED":
        return <Check className="h-3 w-3 text-green-500" />
      case "FAILED":
        return <X className="h-3 w-3 text-red-500" />
      case "PUBLISHING":
        return <Loader2 className="h-3 w-3 animate-spin text-violet-500" />
      case "PENDING":
      case "SKIPPED":
      default:
        return <Clock className="h-3 w-3 text-muted-foreground" />
    }
  }

  const statusConfig = STATUS_CONFIG[publication.status]

  return (
    <>
      <Card className="transition-colors hover:border-violet-300 dark:hover:border-violet-700">
        <CardContent className="pt-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {/* Informations de la publication */}
            <div className="min-w-0 flex-1 space-y-3">
              {/* Ligne superieure : titre + statut */}
              <div className="flex flex-wrap items-start gap-2">
                <p className="min-w-0 flex-1 font-medium leading-snug">
                  {getLabel()}
                </p>
                <Badge
                  variant="secondary"
                  className={`shrink-0 ${statusConfig.className}`}
                >
                  {statusConfig.label}
                </Badge>
              </div>

              {/* Client */}
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-950">
                  <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400">
                    {publication.client.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {publication.client.name}
                </span>
              </div>

              {/* Plateformes cibles avec indicateur de statut */}
              {publication.platformPublications.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {publication.platformPublications.map((pp) => {
                    const platformKey =
                      pp.platformConnection.platform as PlatformKey
                    const config = PLATFORM_CONFIG[platformKey]
                    return (
                      <div
                        key={pp.id}
                        className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs"
                        style={{
                          borderColor: config?.color ?? "#8b5cf6",
                        }}
                      >
                        {/* Cercle colore de la plateforme */}
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor: config?.color ?? "#8b5cf6",
                          }}
                        />
                        <span
                          className="font-medium"
                          style={{ color: config?.color ?? "#8b5cf6" }}
                        >
                          {config?.name ?? pp.platformConnection.platform}
                        </span>
                        {/* Indicateur de statut */}
                        {renderPlatformStatusIcon(pp.status)}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Date */}
              <p className="text-xs text-muted-foreground">{getDisplayDate()}</p>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 gap-2 sm:flex-col">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 sm:flex-none"
                asChild
              >
                <Link href={`/dashboard/publications/${publication.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Voir
                </Link>
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1 sm:flex-none"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cette publication</DialogTitle>
            <DialogDescription>
              Etes-vous sur de vouloir supprimer cette publication ?{" "}
              <span className="font-semibold text-foreground">
                {publication.title ??
                  publication.baseContent.slice(0, 50) + "..."}
              </span>{" "}
              Cette action est irreversible.
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
              onClick={handleDeleteConfirm}
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
    </>
  )
}
