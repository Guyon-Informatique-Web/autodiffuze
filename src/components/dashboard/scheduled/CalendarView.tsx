"use client"

// Vue calendrier des publications planifiees
// Affiche un mois avec navigation et un panneau lateral pour les details du jour
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Rocket,
  Trash2,
} from "lucide-react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns"
import { fr } from "date-fns/locale"
import { PLATFORM_CONFIG, type PlatformKey } from "@/config/platforms"
import type { SerializedPublication } from "@/components/dashboard/scheduled/ScheduledContent"

// Noms des jours de la semaine (lundi en premier)
const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]

interface CalendarViewProps {
  publications: SerializedPublication[]
}

export function CalendarView({ publications }: CalendarViewProps) {
  const router = useRouter()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Etats pour les actions
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingPub, setDeletingPub] = useState<SerializedPublication | null>(
    null
  )
  const [isDeleting, setIsDeleting] = useState(false)

  // Generer les jours du calendrier (debut de semaine lundi)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [currentMonth])

  // Regrouper les publications par jour (cle : date ISO sans heure)
  const publicationsByDay = useMemo(() => {
    const map = new Map<string, SerializedPublication[]>()
    for (const pub of publications) {
      if (!pub.scheduledAt) continue
      const dateKey = format(new Date(pub.scheduledAt), "yyyy-MM-dd")
      const existing = map.get(dateKey) ?? []
      existing.push(pub)
      map.set(dateKey, existing)
    }
    return map
  }, [publications])

  // Publications du jour selectionne
  const selectedDayPublications = useMemo(() => {
    if (!selectedDate) return []
    const dateKey = format(selectedDate, "yyyy-MM-dd")
    return publicationsByDay.get(dateKey) ?? []
  }, [selectedDate, publicationsByDay])

  // Navigation mois precedent / suivant
  function handlePreviousMonth() {
    setCurrentMonth((prev) => subMonths(prev, 1))
  }

  function handleNextMonth() {
    setCurrentMonth((prev) => addMonths(prev, 1))
  }

  // Cliquer sur un jour
  function handleDayClick(day: Date) {
    setSelectedDate(day)
    const dateKey = format(day, "yyyy-MM-dd")
    const pubs = publicationsByDay.get(dateKey)
    if (pubs && pubs.length > 0) {
      setSheetOpen(true)
    }
  }

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

  // Obtenir le label tronque d'une publication
  function getPublicationLabel(pub: SerializedPublication): string {
    if (pub.title) {
      return pub.title.length > 50 ? pub.title.slice(0, 50) + "..." : pub.title
    }
    return pub.baseContent.length > 50
      ? pub.baseContent.slice(0, 50) + "..."
      : pub.baseContent
  }

  return (
    <>
      <Card className="p-4">
        {/* En-tete du calendrier : navigation par mois */}
        <div className="mb-4 flex items-center justify-between">
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Mois precedent</span>
          </Button>
          <h2 className="text-lg font-semibold capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: fr })}
          </h2>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Mois suivant</span>
          </Button>
        </div>

        {/* Labels des jours de la semaine */}
        <div className="mb-2 grid grid-cols-7 gap-1">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="text-center text-xs font-medium text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Grille des jours */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd")
            const dayPubs = publicationsByDay.get(dateKey)
            const hasPubs = dayPubs && dayPubs.length > 0
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            const isTodayDate = isToday(day)

            return (
              <button
                key={dateKey}
                onClick={() => handleDayClick(day)}
                className={`
                  relative flex min-h-[4rem] flex-col items-center rounded-lg p-1 text-sm transition-colors
                  ${!isCurrentMonth ? "text-muted-foreground/40" : ""}
                  ${isSelected ? "bg-violet-100 ring-2 ring-violet-500 dark:bg-violet-950" : "hover:bg-accent"}
                  ${isTodayDate && !isSelected ? "bg-blue-50 font-bold text-blue-600 dark:bg-blue-950 dark:text-blue-400" : ""}
                `}
              >
                <span
                  className={`
                    flex h-7 w-7 items-center justify-center rounded-full text-xs
                    ${isTodayDate ? "bg-blue-600 text-white dark:bg-blue-500" : ""}
                  `}
                >
                  {format(day, "d")}
                </span>

                {/* Puces des publications */}
                {hasPubs && (
                  <div className="mt-1 flex flex-wrap justify-center gap-0.5">
                    {dayPubs.slice(0, 3).map((pub) => (
                      <span
                        key={pub.id}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          backgroundColor:
                            pub.platforms.length > 0
                              ? PLATFORM_CONFIG[
                                  pub.platforms[0].platform as PlatformKey
                                ]?.color ?? "#8b5cf6"
                              : "#8b5cf6",
                        }}
                      />
                    ))}
                    {dayPubs.length > 3 && (
                      <span className="text-[10px] leading-none text-muted-foreground">
                        +{dayPubs.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </Card>

      {/* Panneau lateral avec les publications du jour selectionne */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>
              {selectedDate
                ? format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })
                : ""}
            </SheetTitle>
            <SheetDescription>
              {selectedDayPublications.length} publication
              {selectedDayPublications.length > 1 ? "s" : ""} planifiee
              {selectedDayPublications.length > 1 ? "s" : ""}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="space-y-3">
              {selectedDayPublications.map((pub) => (
                <div
                  key={pub.id}
                  className="rounded-lg border p-3 transition-colors hover:bg-accent/30"
                >
                  {/* Titre ou extrait */}
                  <p className="text-sm font-medium">
                    {getPublicationLabel(pub)}
                  </p>

                  {/* Client */}
                  <div className="mt-2 flex items-center gap-2">
                    {pub.client.logoUrl ? (
                      <Image
                        src={pub.client.logoUrl}
                        alt={pub.client.name}
                        width={16}
                        height={16}
                        className="h-4 w-4 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-950">
                        <span className="text-[8px] font-bold text-violet-600 dark:text-violet-400">
                          {pub.client.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {pub.client.name}
                    </span>
                  </div>

                  {/* Plateformes */}
                  <div className="mt-2 flex flex-wrap gap-1">
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

                  {/* Heure */}
                  {pub.scheduledAt && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(pub.scheduledAt), "HH:mm", {
                        locale: fr,
                      })}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={() => handlePublish(pub.id)}
                      disabled={publishingId === pub.id}
                    >
                      {publishingId === pub.id ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <Rocket className="mr-1 h-3 w-3" />
                      )}
                      Publier maintenant
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="text-xs"
                      onClick={() => handleDeleteClick(pub)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

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
