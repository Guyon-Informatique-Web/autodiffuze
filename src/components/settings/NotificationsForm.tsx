"use client"

// Formulaire de gestion des preferences de notifications
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface NotificationsFormProps {
  initialNotifyEmail: boolean
  initialNotifyDiscord: boolean
  initialDiscordWebhookUrl: string | null
}

export function NotificationsForm({
  initialNotifyEmail,
  initialNotifyDiscord,
  initialDiscordWebhookUrl,
}: NotificationsFormProps) {
  const [notifyEmail, setNotifyEmail] = useState(initialNotifyEmail)
  const [notifyDiscord, setNotifyDiscord] = useState(initialNotifyDiscord)
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState(
    initialDiscordWebhookUrl || ""
  )
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Validation : webhook obligatoire si Discord est active
    if (notifyDiscord && !discordWebhookUrl.trim()) {
      toast.error("Veuillez renseigner l'URL du webhook Discord")
      return
    }

    if (notifyDiscord && !discordWebhookUrl.startsWith("https://discord.com/api/webhooks/")) {
      toast.error("L'URL du webhook doit commencer par https://discord.com/api/webhooks/")
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch("/api/user/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notifyEmail,
          notifyDiscord,
          discordWebhookUrl: notifyDiscord ? discordWebhookUrl : "",
        }),
      })

      const data: { error?: string } = await response.json()

      if (!response.ok) {
        toast.error(
          data.error || "Erreur lors de la mise a jour des notifications"
        )
        return
      }

      toast.success("Preferences de notifications mises a jour")
    } catch {
      toast.error("Erreur de connexion au serveur")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>
          Configurez comment vous souhaitez etre notifie
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Notifications email */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify-email">Notifications par email</Label>
              <p className="text-xs text-muted-foreground">
                Erreurs de publication, token expire, rappel planification
              </p>
            </div>
            <Switch
              id="notify-email"
              checked={notifyEmail}
              onCheckedChange={setNotifyEmail}
            />
          </div>

          {/* Notifications Discord */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notify-discord">Notifications Discord</Label>
                <p className="text-xs text-muted-foreground">
                  Recevoir les notifications via un webhook Discord
                </p>
              </div>
              <Switch
                id="notify-discord"
                checked={notifyDiscord}
                onCheckedChange={setNotifyDiscord}
              />
            </div>

            {notifyDiscord && (
              <div className="space-y-2">
                <Label htmlFor="discord-webhook-url">URL du webhook Discord</Label>
                <Input
                  id="discord-webhook-url"
                  type="url"
                  value={discordWebhookUrl}
                  onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                />
                <p className="text-xs text-muted-foreground">
                  Creez un webhook dans les parametres de votre serveur Discord
                </p>
              </div>
            )}
          </div>

          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
