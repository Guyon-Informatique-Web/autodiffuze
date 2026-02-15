"use client"

// Composant client pour le formulaire d'ajout de client
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ClientForm } from "@/components/dashboard/clients/ClientForm"
import type { CreateClientInput } from "@/lib/validations/client"

export function AddClientForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: CreateClientInput) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error ?? "Erreur lors de la creation du client")
        return
      }

      toast.success("Client cree avec succes")
      router.push("/dashboard/clients")
      router.refresh()
    } catch {
      toast.error("Une erreur est survenue. Veuillez reessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  return <ClientForm onSubmit={handleSubmit} isLoading={isLoading} />
}
