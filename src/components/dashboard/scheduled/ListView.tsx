"use client"

// Vue liste des publications planifiees
// Affiche les publications triees par date planifiee (prochaines d'abord)
import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  CalendarClock,
  Clock,
  Loader2,
  Rocket,
  Trash2,
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { PLATFORM_CONFIG, type PlatformKey } from "@/config/platforms"
import type { SerializedPublication } from "@/components/dashboard/scheduled/ScheduledContent"

interface ListViewProps {
  publications: SerializedPublication[]
}

export function ListView({ publications }: ListViewProps) {
  const router = useRouter()

  // Etats pour les actions
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingPub, setDeletingPub] = useState<SerializedPublication | null>(
    null
  )
  const [isDeleting, setIsDeleting] = useState(false)

  // Publier immediatement
  async function handlePublish(pubId: string) {
    setPublishingId(pubId)
    try {
      const response = await fetch(`/api/publications/${pubId}/publish`, {
        method: "POST",
      })

      if (response.ok) {
        toast.success("Publication lancee avec succes")
        router.refresh()
      } else {
        const data = (await response.json()) as { error: string }
        toast.error(data.error || "Echec de la publication")
      }
    } catch {
      toast.error("Erreur de connexion au serveur")
    } finally {
      setPublishingId(null)
    }
  }

  // Ouvrir le dialog de confirmation de suppression
  function handleDeleteClick(pub: SerializedPublication) {
    setDeletingPub(pub)
    setDeleteDialogOpen(true)
  }

  // Confirmer la suppression
  async function handleDeleteConfirm() {
    if (!deletingPub) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/publications/${deletingPub.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Publication annulee et supprimee")
        setDeleteDialogOpen(false)
        setDeletingPub(null)
        router.refresh()
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

  // Formater la date en francais : "Lundi 17 fevrier 2025 a 14:30"
  function formatScheduledDate(isoDate: string): string {
    const date = new Date(isoDate)
    const dayPart = format(date, "EEEE d MMMM yyyy", { locale: fr })
    const timePart = format(date, "HH:mm", { locale: fr })
    return `${dayPart} a ${timePart}`
  }

  // Obtenir le label tronque d'une publication (80 chars pour la vue liste)
  function getPublicationLabel(pub: SerializedPublication): string {
    if (pub.title) {
      return pub.title.length > 80 ? pub.title.slice(0, 80) + "..." : pub.title
    }
    return pub.baseContent.length > 80
      ? pub.baseContent.slice(0, 80) + "..."
      : pub.baseContent
  }

  return (
    <>
      <div className="space-y-3">
        {publications.map((pub, index) => (
          <Card
            key={pub.id}
            className="transition-colors hover:border-violet-300 dark:hover:border-violet-700"
          >
            <CardContent className="pt-0">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                {/* Informations de la publication */}
                <div className="min-w-0 flex-1 space-y-3">
                  {/* Titre ou extrait */}
                  <p className="font-medium leading-snug">
                    {getPublicationLabel(pub)}
                  </p>

                  {/* Client */}
                  <div className="flex items-center gap-2">
                    {pub.client.logoUrl ? (
                      <Image
                        src={pub.client.logoUrl}
                        alt={pub.client.name}
                        width={20}
                        height={20}
                        className="h-5 w-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-950">
                        <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400">
                          {pub.client.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {pub.client.name}
                    </span>
                  </div>

                  {/* Plateformes cibles */}
                  <div className="flex flex-wrap gap-1.5">
                    {pub.platforms.map((p) => {
                      const config =
                        PLATFORM_CONFIG[p.platform as PlatformKey]
                      return (
                        <Badge
                          key={p.id}
                          variant="outline"
                          className="text-xs"
                          style={{
                            borderColor: config?.color ?? "#8b5cf6",
                            color: config?.color ?? "#8b5cf6",
                          }}
                        >
                          <Image
                            src={config?.icon ?? ""}
                            alt={config?.name ?? p.platform}
                            width={12}
                            height={12}
                            className="mr-1 h-3 w-3"
                          />
                          {config?.name ?? p.platform}
                        </Badge>
                      )
                    })}
                  </div>

                  {/* Date et heure planifiee */}
                  {pub.scheduledAt && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <CalendarClock className="h-4 w-4 shrink-0" />
                      <span className="capitalize">
                        {formatScheduledDate(pub.scheduledAt)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex shrink-0 gap-2 sm:flex-col">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 sm:flex-none"
                    onClick={() => handlePublish(pub.id)}
                    disabled={publishingId === pub.id}
                  >
                    {publishingId === pub.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Rocket className="mr-2 h-4 w-4" />
                    )}
                    Publier maintenant
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1 sm:flex-none"
                    onClick={() => handleDeleteClick(pub)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Annuler
                  </Button>
                </div>
              </div>
            </CardContent>

            {/* Separateur entre les items (sauf le dernier) */}
            {index < publications.length - 1 && (
              <div className="hidden" aria-hidden="true" />
            )}
          </Card>
        ))}
      </div>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler la publication planifiee</DialogTitle>
            <DialogDescription>
              Etes-vous sur de vouloir annuler et supprimer cette publication ?
              {deletingPub && (
                <>
                  {" "}
                  <span className="font-semibold text-foreground">
                    {deletingPub.title ??
                      deletingPub.baseContent.slice(0, 50) + "..."}
                  </span>
                </>
              )}
              {" "}Cette action est irreversible.
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
