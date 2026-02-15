"use client"

// Formulaire reutilisable pour la creation et l'edition d'un template
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Plus, X, Info } from "lucide-react"
import {
  CONTENT_TYPES,
  PLATFORM_TYPES,
  TEMPLATE_CATEGORIES,
  TEMPLATE_VARIABLES,
  createTemplateSchema,
  type CreateTemplateInput,
} from "@/lib/validations/template"
import { PLATFORM_CONFIG, type PlatformKey } from "@/config/platforms"

// Labels lisibles pour les types de contenu
const CONTENT_TYPE_LABELS: Record<string, string> = {
  POST: "Post",
  STORY: "Story",
  REEL: "Reel",
  ARTICLE: "Article",
  THREAD: "Thread",
}

interface TemplateFormProps {
  initialData?: Partial<CreateTemplateInput>
  onSubmit: (data: CreateTemplateInput) => Promise<void>
  isLoading: boolean
}

export function TemplateForm({
  initialData,
  onSubmit,
  isLoading,
}: TemplateFormProps) {
  const [name, setName] = useState(initialData?.name ?? "")
  const [description, setDescription] = useState(
    initialData?.description ?? ""
  )
  const [baseContent, setBaseContent] = useState(
    initialData?.baseContent ?? ""
  )
  const [contentType, setContentType] = useState<string>(
    initialData?.contentType ?? "POST"
  )
  const [platforms, setPlatforms] = useState<string[]>(
    initialData?.platforms ?? []
  )
  const [hashtags, setHashtags] = useState<string[]>(
    initialData?.hashtags ?? []
  )
  const [hashtagInput, setHashtagInput] = useState("")
  const [category, setCategory] = useState(initialData?.category ?? "")
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  // Gestion des hashtags
  const addHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, "")
    if (tag && !hashtags.includes(tag)) {
      setHashtags([...hashtags, tag])
      setHashtagInput("")
    }
  }

  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter((h) => h !== tag))
  }

  const handleHashtagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addHashtag()
    }
  }

  // Gestion des plateformes
  const togglePlatform = (platform: string) => {
    setPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    )
  }

  // Insertion d'une variable dans le contenu
  const insertVariable = (variable: string) => {
    setBaseContent((prev) => prev + variable)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const formData: CreateTemplateInput = {
      name,
      description,
      baseContent,
      contentType: contentType as CreateTemplateInput["contentType"],
      platforms: platforms as CreateTemplateInput["platforms"],
      hashtags,
      category,
    }

    const validation = createTemplateSchema.safeParse(formData)

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors
      const mapped: Record<string, string[]> = {}
      for (const [key, value] of Object.entries(fieldErrors)) {
        if (value) {
          mapped[key] = value
        }
      }
      setErrors(mapped)
      return
    }

    await onSubmit(validation.data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nom du template */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Nom du template <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          placeholder="Ex : Promotion produit"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
        />
        {errors.name && (
          <Alert variant="destructive" className="py-2">
            <AlertDescription className="text-sm">
              {errors.name[0]}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          placeholder="Description courte du template..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isLoading}
        />
        {errors.description && (
          <Alert variant="destructive" className="py-2">
            <AlertDescription className="text-sm">
              {errors.description[0]}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Type de contenu */}
      <div className="space-y-2">
        <Label>Type de contenu</Label>
        <Tabs
          value={contentType}
          onValueChange={setContentType}
        >
          <TabsList className="w-full">
            {CONTENT_TYPES.map((type) => (
              <TabsTrigger key={type} value={type} disabled={isLoading}>
                {CONTENT_TYPE_LABELS[type]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Contenu de base */}
      <div className="space-y-2">
        <Label htmlFor="baseContent">
          Contenu de base <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="baseContent"
          placeholder="Redigez votre template ici. Utilisez les variables pour personnaliser le contenu..."
          value={baseContent}
          onChange={(e) => setBaseContent(e.target.value)}
          disabled={isLoading}
          rows={8}
          className="font-mono text-sm"
        />
        {errors.baseContent && (
          <Alert variant="destructive" className="py-2">
            <AlertDescription className="text-sm">
              {errors.baseContent[0]}
            </AlertDescription>
          </Alert>
        )}

        {/* Aide contextuelle : variables disponibles */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
            <Info className="h-4 w-4" />
            Variables disponibles
          </div>
          <p className="mb-2 text-xs text-blue-600 dark:text-blue-400">
            Cliquez sur une variable pour l&apos;inserer dans le contenu. Elles
            seront remplacees automatiquement lors de l&apos;utilisation du
            template.
          </p>
          <div className="flex flex-wrap gap-2">
            {TEMPLATE_VARIABLES.map((variable) => (
              <button
                key={variable}
                type="button"
                onClick={() => insertVariable(variable)}
                disabled={isLoading}
                className="rounded-md bg-blue-100 px-2.5 py-1 font-mono text-xs font-semibold text-blue-800 transition-colors hover:bg-blue-200 disabled:opacity-50 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
              >
                {variable}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Plateformes par defaut */}
      <div className="space-y-2">
        <Label>Plateformes par defaut</Label>
        <p className="text-xs text-muted-foreground">
          Selectionnez les plateformes qui seront pre-selectionnees lors de
          l&apos;utilisation de ce template.
        </p>
        <div className="flex flex-wrap gap-2">
          {PLATFORM_TYPES.map((platform) => {
            const config = PLATFORM_CONFIG[platform as PlatformKey]
            const isSelected = platforms.includes(platform)

            return (
              <button
                key={platform}
                type="button"
                onClick={() => togglePlatform(platform)}
                disabled={isLoading}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                  isSelected
                    ? "border-transparent text-white"
                    : "border-border bg-background text-foreground hover:bg-accent"
                }`}
                style={
                  isSelected
                    ? { backgroundColor: config.color }
                    : undefined
                }
              >
                {config.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Categorie et Hashtags sur la meme ligne */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Categorie */}
        <div className="space-y-2">
          <Label htmlFor="category">Categorie</Label>
          <Select
            value={category}
            onValueChange={setCategory}
            disabled={isLoading}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Selectionner une categorie" />
            </SelectTrigger>
            <SelectContent>
              {TEMPLATE_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Hashtags */}
        <div className="space-y-2">
          <Label htmlFor="hashtags">Hashtags</Label>
          <div className="flex gap-2">
            <Input
              id="hashtags"
              placeholder="Ajouter un hashtag..."
              value={hashtagInput}
              onChange={(e) => setHashtagInput(e.target.value)}
              onKeyDown={handleHashtagKeyDown}
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={addHashtag}
              disabled={isLoading || !hashtagInput.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {hashtags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="gap-1 pl-2.5 pr-1"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeHashtag(tag)}
                    disabled={isLoading}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bouton de soumission */}
      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-700 hover:to-blue-600"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Enregistrer les modifications" : "Creer le template"}
        </Button>
      </div>
    </form>
  )
}
