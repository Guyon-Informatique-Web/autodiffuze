"use client"

// Selecteur de template pour pre-remplir l'editeur de publication
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { LayoutTemplate } from "lucide-react"
import { PLATFORM_CONFIG, type PlatformKey } from "@/config/platforms"

// --- Types ---

export interface TemplateSelectorItem {
  id: string
  name: string
  description: string | null
  baseContent: string
  contentType: string
  platforms: string[]
  hashtags: string[]
  category: string | null
}

interface TemplateSelectorProps {
  templates: TemplateSelectorItem[]
  onSelect: (template: TemplateSelectorItem) => void
  disabled?: boolean
}

// --- Composant ---

export function TemplateSelector({
  templates,
  onSelect,
  disabled = false,
}: TemplateSelectorProps) {
  const [open, setOpen] = useState(false)

  if (templates.length === 0) return null

  const handleSelect = (template: TemplateSelectorItem) => {
    onSelect(template)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-1.5"
        >
          <LayoutTemplate className="h-3.5 w-3.5" />
          Utiliser un template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Choisir un template</DialogTitle>
          <DialogDescription>
            Selectionnez un template pour pre-remplir votre publication.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto -mx-6 px-6 space-y-3 pb-2">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => handleSelect(template)}
            >
              <CardContent className="p-4 space-y-2">
                {/* En-tete : nom et categorie */}
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold truncate">
                    {template.name}
                  </h4>
                  {template.category && (
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {template.category}
                    </Badge>
                  )}
                </div>

                {/* Description ou extrait du contenu */}
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {template.description || template.baseContent}
                </p>

                {/* Plateformes par defaut */}
                {template.platforms.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {template.platforms.map((platform) => {
                      const config =
                        PLATFORM_CONFIG[platform as PlatformKey]
                      if (!config) return null
                      return (
                        <Badge
                          key={platform}
                          variant="outline"
                          className="text-xs py-0"
                          style={{
                            borderColor: config.color,
                            color: config.color,
                          }}
                        >
                          {config.name}
                        </Badge>
                      )
                    })}
                  </div>
                )}

                {/* Hashtags */}
                {template.hashtags.length > 0 && (
                  <p className="text-xs text-muted-foreground truncate">
                    {template.hashtags.map((h) => `#${h}`).join(" ")}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
