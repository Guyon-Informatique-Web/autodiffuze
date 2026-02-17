"use client"

// Dialog pour connecter une nouvelle plateforme sociale via OAuth
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Link2, ExternalLink } from "lucide-react"

// Plateformes disponibles a la connexion OAuth
// Meta gere Facebook + Instagram en un seul flow
const OAUTH_PLATFORMS = [
  {
    id: "meta",
    name: "Meta (Facebook + Instagram)",
    icon: "/platforms/facebook.svg",
    description: "Connectez vos pages Facebook et comptes Instagram professionnels",
    color: "#1877F2",
    route: "/api/auth/platforms/meta",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: "/platforms/linkedin.svg",
    description: "Publiez sur votre profil ou vos pages LinkedIn",
    color: "#0A66C2",
    route: "/api/auth/platforms/linkedin",
  },
  {
    id: "x",
    name: "X (Twitter)",
    icon: "/platforms/x.svg",
    description: "Publiez des tweets et threads automatiquement",
    color: "#14171A",
    route: "/api/auth/platforms/x",
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: "/platforms/tiktok.svg",
    description: "Publiez vos videos sur TikTok",
    color: "#010101",
    route: "/api/auth/platforms/tiktok",
  },
] as const

interface ConnectPlatformDialogProps {
  clientId: string
  children?: React.ReactNode
}

export function ConnectPlatformDialog({ clientId, children }: ConnectPlatformDialogProps) {
  const [open, setOpen] = useState(false)

  // Redirige vers la route OAuth de la plateforme avec le clientId
  function handleConnect(route: string) {
    window.location.href = `${route}?clientId=${clientId}`
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4" />
            Connecter une plateforme
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Connecter une plateforme
          </DialogTitle>
          <DialogDescription>
            Choisissez la plateforme a connecter pour ce client. Vous serez redirige vers la page d&apos;autorisation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 pt-2">
          {OAUTH_PLATFORMS.map((platform) => (
            <button
              key={platform.id}
              onClick={() => handleConnect(platform.route)}
              className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg p-2"
                style={{ backgroundColor: `${platform.color}15` }}
              >
                <img
                  src={platform.icon}
                  alt={platform.name}
                  className="h-6 w-6"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{platform.name}</p>
                <p className="text-xs text-muted-foreground">
                  {platform.description}
                </p>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
