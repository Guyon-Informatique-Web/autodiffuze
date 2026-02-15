"use client"

// Dialog de confirmation pour deconnecter une plateforme
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, Unlink } from "lucide-react"

interface DisconnectDialogProps {
  platformName: string
  accountName: string
  onConfirm: () => Promise<void>
  children: React.ReactNode
}

export function DisconnectDialog({
  platformName,
  accountName,
  onConfirm,
  children,
}: DisconnectDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    try {
      await onConfirm()
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deconnecter {platformName}</DialogTitle>
          <DialogDescription>
            Vous etes sur le point de deconnecter le compte{" "}
            <span className="font-medium text-foreground">{accountName}</span>{" "}
            de {platformName}. Cette action est irreversible et les publications
            planifiees sur cette plateforme ne pourront plus etre diffusees.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Unlink className="h-4 w-4" />
            )}
            Deconnecter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
