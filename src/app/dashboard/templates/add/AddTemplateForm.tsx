"use client"

// Composant client pour le formulaire d'ajout de template
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { TemplateForm } from "@/components/dashboard/templates/TemplateForm"
import type { CreateTemplateInput } from "@/lib/validations/template"

export function AddTemplateForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: CreateTemplateInput) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error ?? "Erreur lors de la creation du template")
        return
      }

      toast.success("Template cree avec succes")
      router.push("/dashboard/templates")
      router.refresh()
    } catch {
      toast.error("Une erreur est survenue. Veuillez reessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  return <TemplateForm onSubmit={handleSubmit} isLoading={isLoading} />
}
