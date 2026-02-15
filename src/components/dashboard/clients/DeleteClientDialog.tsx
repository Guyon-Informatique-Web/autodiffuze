"use client"

// Dialog de confirmation de suppression d'un client
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
import { Loader2, Trash2 } from "lucide-react"

interface DeleteClientDialogProps {
  clientName: string
  onConfirm: () => Promise<void>
}

export function DeleteClientDialog({
  clientName,
  onConfirm,
}: DeleteClientDialogProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
      setOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer le client</DialogTitle>
          <DialogDescription>
            Etes-vous sur de vouloir supprimer{" "}
            <span className="font-semibold text-foreground">{clientName}</span> ?
            Cette action est irreversible. Toutes les publications et connexions
            de plateformes associees seront egalement supprimees.
          </DialogDescription>
        </DialogHeader>
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
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Supprimer definitivement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
