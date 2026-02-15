"use client"

// Dialog de confirmation de suppression d'un template
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

interface DeleteTemplateDialogProps {
  templateName: string
  onConfirm: () => Promise<void>
}

export function DeleteTemplateDialog({
  templateName,
  onConfirm,
}: DeleteTemplateDialogProps) {
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
          <DialogTitle>Supprimer le template</DialogTitle>
          <DialogDescription>
            Etes-vous sur de vouloir supprimer{" "}
            <span className="font-semibold text-foreground">
              {templateName}
            </span>{" "}
            ? Cette action est irreversible. Les publications existantes
            utilisant ce template ne seront pas affectees.
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
