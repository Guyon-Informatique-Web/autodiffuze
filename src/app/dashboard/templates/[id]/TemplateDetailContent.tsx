"use client"

// Composant client pour le detail d'un template avec mode edition
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TemplateForm } from "@/components/dashboard/templates/TemplateForm"
import { DeleteTemplateDialog } from "@/components/dashboard/templates/DeleteTemplateDialog"
import {
  ArrowLeft,
  Pencil,
  X,
  LayoutTemplate,
  PenSquare,
  Hash,
} from "lucide-react"
import { PLATFORM_CONFIG, type PlatformKey } from "@/config/platforms"
import type { CreateTemplateInput } from "@/lib/validations/template"

// Types serialises (dates en string)
interface SerializedTemplate {
  id: string
  userId: string
  name: string
  description: string | null
  baseContent: string
  contentType: string
  platforms: string[]
  hashtags: string[]
  category: string | null
  createdAt: string
  updatedAt: string
}

// Labels lisibles pour les types de contenu
const CONTENT_TYPE_LABELS: Record<string, string> = {
  POST: "Post",
  STORY: "Story",
  REEL: "Reel",
  ARTICLE: "Article",
  THREAD: "Thread",
}

// Couleurs des badges de categorie
const CATEGORY_COLORS: Record<string, string> = {
  Promotion:
    "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  Evenement:
    "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  Actualite:
    "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  Temoignage:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  Conseil:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  Autre:
    "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-300",
}

interface TemplateDetailContentProps {
  template: SerializedTemplate
}

// Mise en evidence des variables dans le contenu
function HighlightedContent({ content }: { content: string }) {
  // Decoupage du contenu autour des variables {{...}}
  const parts = content.split(/(\{\{[^}]+\}\})/)

  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed">
      {parts.map((part, index) => {
        if (part.match(/^\{\{[^}]+\}\}$/)) {
          return (
            <span
              key={index}
              className="rounded bg-violet-100 px-1 py-0.5 font-mono text-xs font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300"
            >
              {part}
            </span>
          )
        }
        return <span key={index}>{part}</span>
      })}
    </p>
  )
}

export function TemplateDetailContent({
  template,
}: TemplateDetailContentProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleUpdate = async (data: CreateTemplateInput) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error ?? "Erreur lors de la modification")
        return
      }

      toast.success("Template modifie avec succes")
      setIsEditing(false)
      router.refresh()
    } catch {
      toast.error("Une erreur est survenue. Veuillez reessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/templates/${template.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const result = await response.json()
        toast.error(result.error ?? "Erreur lors de la suppression")
        return
      }

      toast.success("Template supprime avec succes")
      router.push("/dashboard/templates")
      router.refresh()
    } catch {
      toast.error("Une erreur est survenue. Veuillez reessayer.")
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tete */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/templates">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-blue-100 dark:from-violet-950 dark:to-blue-950">
              <LayoutTemplate className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{template.name}</h1>
              {template.category && (
                <Badge
                  variant="secondary"
                  className={`mt-0.5 border-0 ${
                    CATEGORY_COLORS[template.category] ??
                    CATEGORY_COLORS.Autre
                  }`}
                >
                  {template.category}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            asChild
            className="bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-700 hover:to-blue-600"
            size="sm"
          >
            <Link href={`/dashboard/create?templateId=${template.id}`}>
              <PenSquare className="mr-2 h-4 w-4" />
              Utiliser ce template
            </Link>
          </Button>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Modifier
            </Button>
          )}
          {isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              <X className="mr-2 h-4 w-4" />
              Annuler
            </Button>
          )}
          <DeleteTemplateDialog
            templateName={template.name}
            onConfirm={handleDelete}
          />
        </div>
      </div>

      {/* Contenu principal */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Informations du template / Mode edition */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {isEditing ? "Modifier le template" : "Contenu du template"}
            </CardTitle>
            {!isEditing && template.description && (
              <CardDescription>{template.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <TemplateForm
                initialData={{
                  name: template.name,
                  description: template.description ?? "",
                  baseContent: template.baseContent,
                  contentType: template.contentType as CreateTemplateInput["contentType"],
                  platforms: template.platforms as CreateTemplateInput["platforms"],
                  hashtags: template.hashtags,
                  category: template.category ?? "",
                }}
                onSubmit={handleUpdate}
                isLoading={isLoading}
              />
            ) : (
              <div className="space-y-4">
                <HighlightedContent content={template.baseContent} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panneau lateral : informations complementaires */}
        {!isEditing && (
          <div className="space-y-6">
            {/* Type de contenu */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Type de contenu
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Badge variant="outline" className="text-sm">
                  {CONTENT_TYPE_LABELS[template.contentType] ??
                    template.contentType}
                </Badge>
              </CardContent>
            </Card>

            {/* Plateformes par defaut */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Plateformes par defaut
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {template.platforms.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucune plateforme selectionnee
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {template.platforms.map((platform) => {
                      const config =
                        PLATFORM_CONFIG[platform as PlatformKey]
                      if (!config) return null
                      return (
                        <Badge
                          key={platform}
                          variant="outline"
                          className="border-0 text-white"
                          style={{ backgroundColor: config.color }}
                        >
                          {config.name}
                        </Badge>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Hashtags */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Hash className="h-4 w-4" />
                  Hashtags
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {template.hashtags.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucun hashtag
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {template.hashtags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Informations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <div>
                  <p className="text-xs text-muted-foreground">Cree le</p>
                  <p className="text-sm">
                    {new Date(template.createdAt).toLocaleDateString(
                      "fr-FR",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Derniere modification
                  </p>
                  <p className="text-sm">
                    {new Date(template.updatedAt).toLocaleDateString(
                      "fr-FR",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
