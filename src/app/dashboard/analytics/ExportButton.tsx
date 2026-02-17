"use client"

// Bouton d'export CSV des publications
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"

export function ExportButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleExport = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/analytics/export")
      if (!res.ok) {
        const data = await res.json()
        alert(data.error ?? "Erreur lors de l'export")
        return
      }

      // Telecharge le fichier CSV via blob
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      // Extraction du nom de fichier depuis le header ou fallback
      const disposition = res.headers.get("content-disposition")
      const filenameMatch = disposition?.match(/filename="(.+)"/)
      a.download = filenameMatch?.[1] ?? "autodiffuze-export.csv"
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Erreur export CSV :", err)
      alert("Erreur lors de l'export")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      Exporter CSV
    </Button>
  )
}
