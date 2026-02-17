"use client"

// Cloche de notifications avec dropdown
import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  AlertCircle,
  KeyRound,
  CalendarClock,
  TrendingUp,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

interface Notification {
  id: string
  type: "PUBLISH_FAILED" | "TOKEN_EXPIRED" | "SCHEDULED_REMINDER" | "PLAN_LIMIT_WARNING"
  title: string
  message: string
  read: boolean
  createdAt: string
}

// Icone et couleur selon le type de notification
const NOTIFICATION_STYLES: Record<
  Notification["type"],
  { icon: typeof AlertCircle; className: string }
> = {
  PUBLISH_FAILED: {
    icon: AlertCircle,
    className: "text-red-600 dark:text-red-400",
  },
  TOKEN_EXPIRED: {
    icon: KeyRound,
    className: "text-orange-600 dark:text-orange-400",
  },
  SCHEDULED_REMINDER: {
    icon: CalendarClock,
    className: "text-blue-600 dark:text-blue-400",
  },
  PLAN_LIMIT_WARNING: {
    icon: TrendingUp,
    className: "text-amber-600 dark:text-amber-400",
  },
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)

  // Charge les notifications et le compteur non-lus
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/notifications?perPage=10")
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
      setHasFetched(true)
    } catch (err) {
      console.error("Erreur chargement notifications :", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Charge le compteur non-lus au premier render (leger)
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?perPage=1")
      if (!res.ok) return
      const data = await res.json()
      setUnreadCount(data.unreadCount)
    } catch {
      // Silencieux
    }
  }, [])

  // Charge le compteur au montage si pas encore fait
  if (!hasFetched && unreadCount === 0) {
    // On utilise un flag pour eviter les appels multiples
    fetchUnreadCount()
  }

  // Marquer une notification comme lue
  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "PATCH" })
      if (!res.ok) return
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error("Erreur marquer comme lu :", err)
    }
  }

  // Tout marquer comme lu
  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications/read-all", { method: "PATCH" })
      if (!res.ok) return
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error("Erreur tout marquer comme lu :", err)
    }
  }

  // Supprimer une notification
  const deleteNotification = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" })
      if (!res.ok) return
      const removed = notifications.find((n) => n.id === id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      if (removed && !removed.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error("Erreur suppression notification :", err)
    }
  }

  return (
    <DropdownMenu onOpenChange={(open) => { if (open) fetchNotifications() }}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px]"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {/* En-tete */}
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-sm font-semibold">Notifications</p>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="h-3 w-3" />
              Tout marquer lu
            </button>
          )}
        </div>
        <DropdownMenuSeparator />

        {/* Liste des notifications */}
        {isLoading ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            Chargement...
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            Aucune notification
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((notif) => {
              const style = NOTIFICATION_STYLES[notif.type]
              const Icon = style.icon

              return (
                <DropdownMenuItem
                  key={notif.id}
                  className="flex cursor-default items-start gap-3 px-3 py-2.5"
                  onSelect={(e) => e.preventDefault()}
                >
                  {/* Indicateur non-lu */}
                  <div className="mt-1 flex-shrink-0">
                    <Icon className={`h-4 w-4 ${style.className}`} />
                  </div>

                  {/* Contenu */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-tight ${notif.read ? "text-muted-foreground" : "font-medium"}`}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-violet-600" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {notif.message}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(notif.createdAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                      <div className="flex items-center gap-1">
                        {!notif.read && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                            title="Marquer comme lu"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notif.id)}
                          className="rounded p-0.5 text-muted-foreground hover:text-red-600"
                          title="Supprimer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              )
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
