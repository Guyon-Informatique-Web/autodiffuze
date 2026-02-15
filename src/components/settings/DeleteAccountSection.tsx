"use client"

// Section zone de danger - suppression du compte
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

export function DeleteAccountSection() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (confirmText !== "SUPPRIMER") return

    setIsDeleting(true)

    try {
      const response = await fetch("/api/user", {
        method: "DELETE",
      })

      const data: { error?: string } = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Erreur lors de la suppression du compte")
        return
      }

      toast.success("Compte supprime avec succes")
      router.push("/")
    } catch {
      toast.error("Erreur de connexion au serveur")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
          <AlertTriangle className="h-5 w-5" />
          Zone de danger
        </CardTitle>
        <CardDescription className="text-red-600/80 dark:text-red-400/80">
          Actions irreversibles sur votre compte
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            La suppression de votre compte est definitive. Toutes vos donnees,
            publications, clients et connexions de plateformes seront
            supprimees. Si vous avez un abonnement payant, il sera annule.
          </p>
          <Dialog open={open} onOpenChange={(v) => {
            setOpen(v)
            if (!v) setConfirmText("")
          }}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                Supprimer mon compte
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Supprimer votre compte</DialogTitle>
                <DialogDescription>
                  Cette action est irreversible. Toutes vos donnees seront
                  definitivement supprimees.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="confirm-delete">
                  Tapez{" "}
                  <span className="font-bold text-destructive">SUPPRIMER</span>{" "}
                  pour confirmer
                </Label>
                <Input
                  id="confirm-delete"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="SUPPRIMER"
                />
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isDeleting}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={confirmText !== "SUPPRIMER" || isDeleting}
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
      </CardContent>
    </Card>
  )
}
