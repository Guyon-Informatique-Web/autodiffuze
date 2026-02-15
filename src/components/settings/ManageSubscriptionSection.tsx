"use client"

// Section pour gerer l'abonnement via le portail Stripe
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function ManageSubscriptionSection() {
  const [isLoading, setIsLoading] = useState(false)

  const handleManage = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      })

      const data: { url?: string; error?: string } = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Erreur lors de l'acces au portail Stripe")
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      toast.error("Erreur de connexion au serveur")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerer l&apos;abonnement</CardTitle>
        <CardDescription>
          Modifier votre moyen de paiement, telecharger vos factures ou annuler
          votre abonnement.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleManage} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ExternalLink className="mr-2 h-4 w-4" />
          )}
          Gerer via Stripe
        </Button>
      </CardContent>
    </Card>
  )
}
