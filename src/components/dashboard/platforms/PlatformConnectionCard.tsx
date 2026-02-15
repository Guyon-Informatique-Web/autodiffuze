"use client"

// Carte affichant une connexion plateforme individuelle avec actions
import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DisconnectDialog } from "@/components/dashboard/platforms/DisconnectDialog"
import { PLATFORM_CONFIG, type PlatformKey } from "@/config/platforms"
import {
  MoreHorizontal,
  RefreshCw,
  Unlink,
  Loader2,
  Clock,
} from "lucide-react"

interface PlatformConnectionData {
  id: string
  platform: PlatformKey
  platformAccountName: string
  isActive: boolean
  tokenExpiresAt: string | null
  lastUsedAt: string | null
  errorMessage: string | null
}

interface PlatformConnectionCardProps {
  connection: PlatformConnectionData
}

// Determiner le statut de la connexion
function getConnectionStatus(connection: PlatformConnectionData): {
  label: string
  variant: "default" | "secondary" | "destructive"
} {
  if (!connection.isActive) {
    return { label: "Erreur", variant: "destructive" }
  }

  if (
    connection.tokenExpiresAt &&
    new Date(connection.tokenExpiresAt) <= new Date()
  ) {
    return { label: "Token expire", variant: "secondary" }
  }

  return { label: "Connecte", variant: "default" }
}

// Formater la date de derniere utilisation
function formatLastUsed(lastUsedAt: string | null): string {
  if (!lastUsedAt) return "Jamais utilisee"

  const date = new Date(lastUsedAt)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return "A l'instant"
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`
  if (diffHours < 24) return `Il y a ${diffHours} h`
  if (diffDays < 30) return `Il y a ${diffDays} j`

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function PlatformConnectionCard({
  connection,
}: PlatformConnectionCardProps) {
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)
  const config = PLATFORM_CONFIG[connection.platform]
  const status = getConnectionStatus(connection)
  const isTokenExpired =
    connection.tokenExpiresAt &&
    new Date(connection.tokenExpiresAt) <= new Date()

  // Rafraichir le token
  async function handleRefresh() {
    setRefreshing(true)
    try {
      const response = await fetch(`/api/platforms/${connection.id}/refresh`, {
        method: "POST",
      })

      if (response.ok) {
        toast.success("Token rafraichi avec succes")
        router.refresh()
      } else {
        const data = (await response.json()) as { error: string }
        toast.error(data.error || "Echec du rafraichissement du token")
      }
    } catch {
      toast.error("Erreur de connexion au serveur")
    } finally {
      setRefreshing(false)
    }
  }

  // Deconnecter la plateforme
  async function handleDisconnect() {
    const response = await fetch(`/api/platforms/${connection.id}`, {
      method: "DELETE",
    })

    if (response.ok) {
      toast.success(`${config.name} deconnecte avec succes`)
      router.refresh()
    } else {
      const data = (await response.json()) as { error: string }
      toast.error(data.error || "Echec de la deconnexion")
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-4 transition-colors hover:bg-accent/30">
      <div className="flex items-center gap-3 min-w-0">
        {/* Icone de la plateforme */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${config.color}15` }}
        >
          <Image
            src={config.icon}
            alt={config.name}
            width={24}
            height={24}
            className="h-6 w-6"
          />
        </div>

        {/* Infos de la connexion */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-medium"
              style={{ color: config.color === "#000000" ? undefined : config.color }}
            >
              {config.name}
            </span>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {connection.platformAccountName}
          </p>
          {connection.errorMessage && (
            <p className="mt-1 truncate text-xs text-destructive">
              {connection.errorMessage}
            </p>
          )}
        </div>
      </div>

      {/* Derniere utilisation et actions */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
          <Clock className="h-3 w-3" />
          {formatLastUsed(connection.lastUsedAt)}
        </div>

        {/* Bouton rafraichir visible si token expire */}
        {isTokenExpired && connection.isActive && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Rafraichir
          </Button>
        )}

        {/* Menu d'actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className="h-4 w-4" />
              Rafraichir le token
            </DropdownMenuItem>
            <DisconnectDialog
              platformName={config.name}
              accountName={connection.platformAccountName}
              onConfirm={handleDisconnect}
            >
              <DropdownMenuItem
                variant="destructive"
                onSelect={(e) => e.preventDefault()}
              >
                <Unlink className="h-4 w-4" />
                Deconnecter
              </DropdownMenuItem>
            </DisconnectDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
