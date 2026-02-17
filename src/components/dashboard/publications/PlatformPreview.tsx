"use client"

// Composant de previsualisation du contenu adapte par plateforme
import { useState, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Loader2, Sparkles, X, Plus, User, Smile } from "lucide-react"
import { toast } from "sonner"
import { PLATFORM_CONFIG, type PlatformKey } from "@/config/platforms"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

// Donnees d'adaptation pour une plateforme
export interface PlatformAdaptation {
  platformConnectionId: string
  platform: PlatformKey
  platformAccountName: string
  adaptedContent: string
  hashtags: string[]
  isAdapting: boolean
}

interface PlatformPreviewProps {
  adaptations: PlatformAdaptation[]
  baseContent: string
  clientId: string
  onAdaptationChange: (
    platformConnectionId: string,
    field: "adaptedContent" | "hashtags",
    value: string | string[]
  ) => void
  onAdaptSingle: (platformConnectionId: string, options?: { useEmojis?: boolean }) => Promise<void>
  onAdaptAll: () => Promise<void>
  isAdaptingAll: boolean
  useEmojis: Record<string, boolean>
  onUseEmojisChange: (platformConnectionId: string, value: boolean) => void
  disabled?: boolean
}

// Determine la couleur de la jauge de caracteres selon le pourcentage
function getCharCountColor(percentage: number): string {
  if (percentage > 100) return "text-red-500"
  if (percentage >= 80) return "text-orange-500"
  return "text-green-600 dark:text-green-400"
}

function getProgressColor(percentage: number): string {
  if (percentage > 100) return "[&_[data-slot=progress-indicator]]:bg-red-500"
  if (percentage >= 80) return "[&_[data-slot=progress-indicator]]:bg-orange-500"
  return "[&_[data-slot=progress-indicator]]:bg-green-500"
}

export function PlatformPreview({
  adaptations,
  baseContent,
  clientId,
  onAdaptationChange,
  onAdaptSingle,
  onAdaptAll,
  isAdaptingAll,
  useEmojis,
  onUseEmojisChange,
  disabled = false,
}: PlatformPreviewProps) {
  // Etat local pour le nouveau hashtag en cours de saisie
  const [newHashtag, setNewHashtag] = useState<Record<string, string>>({})

  // Ajout d'un hashtag a une plateforme
  const handleAddHashtag = useCallback(
    (platformConnectionId: string) => {
      const tag = (newHashtag[platformConnectionId] ?? "").trim()
      if (!tag) return

      const adaptation = adaptations.find(
        (a) => a.platformConnectionId === platformConnectionId
      )
      if (!adaptation) return

      // Nettoyer le hashtag (ajouter # si absent)
      const cleanTag = tag.startsWith("#") ? tag : `#${tag}`

      // Verifier les doublons
      if (adaptation.hashtags.includes(cleanTag)) {
        toast.error("Ce hashtag existe deja")
        return
      }

      // Verifier la limite de hashtags pour la plateforme
      const config = PLATFORM_CONFIG[adaptation.platform]
      if (adaptation.hashtags.length >= config.limits.maxHashtags) {
        toast.error(
          `Maximum ${config.limits.maxHashtags} hashtags pour ${config.name}`
        )
        return
      }

      onAdaptationChange(
        platformConnectionId,
        "hashtags",
        [...adaptation.hashtags, cleanTag]
      )
      setNewHashtag((prev) => ({ ...prev, [platformConnectionId]: "" }))
    },
    [adaptations, newHashtag, onAdaptationChange]
  )

  // Suppression d'un hashtag
  const handleRemoveHashtag = useCallback(
    (platformConnectionId: string, index: number) => {
      const adaptation = adaptations.find(
        (a) => a.platformConnectionId === platformConnectionId
      )
      if (!adaptation) return

      const updated = adaptation.hashtags.filter((_, i) => i !== index)
      onAdaptationChange(platformConnectionId, "hashtags", updated)
    },
    [adaptations, onAdaptationChange]
  )

  if (adaptations.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <Sparkles className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-medium">Aucune plateforme selectionnee</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs">
            Selectionnez au moins une plateforme dans l&apos;editeur pour voir
            la previsualisation du contenu adapte.
          </p>
        </CardContent>
      </Card>
    )
  }

  const defaultTab = adaptations[0]?.platformConnectionId ?? ""

  return (
    <div className="space-y-4">
      {/* Bouton "Adapter toutes les plateformes" */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Previsualisation</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onAdaptAll}
          disabled={
            disabled ||
            isAdaptingAll ||
            !baseContent.trim() ||
            !clientId
          }
        >
          {isAdaptingAll ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          )}
          Adapter toutes
        </Button>
      </div>

      {/* Onglets par plateforme */}
      <Tabs defaultValue={defaultTab}>
        <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
          {adaptations.map((adaptation) => {
            const config = PLATFORM_CONFIG[adaptation.platform]
            return (
              <TabsTrigger
                key={adaptation.platformConnectionId}
                value={adaptation.platformConnectionId}
                className="gap-1.5 text-xs data-[state=active]:shadow-sm"
                style={{
                  borderBottom: `2px solid transparent`,
                }}
                data-platform={adaptation.platform}
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: config.color }}
                />
                {config.name}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {adaptations.map((adaptation) => {
          const config = PLATFORM_CONFIG[adaptation.platform]
          const charCount = adaptation.adaptedContent.length
          const maxChars = config.limits.maxChars
          const percentage = maxChars > 0 ? (charCount / maxChars) * 100 : 0
          const clampedPercentage = Math.min(percentage, 100)

          return (
            <TabsContent
              key={adaptation.platformConnectionId}
              value={adaptation.platformConnectionId}
            >
              <Card>
                {/* Mockup simplifie du rendu social */}
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${config.color}20` }}
                    >
                      <User
                        className="h-5 w-5"
                        style={{ color: config.color }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {adaptation.platformAccountName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {config.name} - Maintenant
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0"
                      style={{
                        borderColor: config.color,
                        color: config.color,
                      }}
                    >
                      {config.name}
                    </Badge>
                  </div>
                </CardHeader>

                <Separator />

                <CardContent className="space-y-4 pt-4">
                  {/* Zone de contenu adapte (editable) */}
                  {adaptation.isAdapting ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-4/5" />
                      <Skeleton className="h-4 w-3/5" />
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-sm text-muted-foreground">
                          Adaptation en cours...
                        </span>
                      </div>
                    </div>
                  ) : (
                    <Textarea
                      value={adaptation.adaptedContent}
                      onChange={(e) =>
                        onAdaptationChange(
                          adaptation.platformConnectionId,
                          "adaptedContent",
                          e.target.value
                        )
                      }
                      placeholder={`Contenu adapte pour ${config.name}...`}
                      className="min-h-[120px] resize-y text-sm"
                      disabled={disabled}
                    />
                  )}

                  {/* Jauge et compteur de caracteres */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Caracteres</span>
                      <span className={cn("font-medium", getCharCountColor(percentage))}>
                        {charCount.toLocaleString()} / {maxChars.toLocaleString()}
                      </span>
                    </div>
                    <Progress
                      value={clampedPercentage}
                      className={cn("h-1.5", getProgressColor(percentage))}
                    />
                    {percentage > 100 && (
                      <p className="text-xs text-red-500 font-medium">
                        Depassement de {(charCount - maxChars).toLocaleString()} caractere(s)
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* Section hashtags */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Hashtags ({adaptation.hashtags.length} / {config.limits.maxHashtags})
                      </span>
                    </div>

                    {/* Badges editables des hashtags */}
                    {adaptation.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {adaptation.hashtags.map((tag, index) => (
                          <Badge
                            key={`${tag}-${index}`}
                            variant="secondary"
                            className="gap-1 pr-1 text-xs"
                          >
                            {tag}
                            {!disabled && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveHashtag(
                                    adaptation.platformConnectionId,
                                    index
                                  )
                                }
                                className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            )}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Ajout d'un hashtag */}
                    {!disabled && (
                      <div className="flex gap-1.5">
                        <Input
                          value={newHashtag[adaptation.platformConnectionId] ?? ""}
                          onChange={(e) =>
                            setNewHashtag((prev) => ({
                              ...prev,
                              [adaptation.platformConnectionId]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              handleAddHashtag(adaptation.platformConnectionId)
                            }
                          }}
                          placeholder="Ajouter un hashtag..."
                          className="h-7 text-xs"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-xs"
                          onClick={() =>
                            handleAddHashtag(adaptation.platformConnectionId)
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Option emojis */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smile className="h-4 w-4 text-muted-foreground" />
                      <Label
                        htmlFor={`emoji-toggle-${adaptation.platformConnectionId}`}
                        className="text-xs font-medium cursor-pointer"
                      >
                        Inclure des emojis
                      </Label>
                    </div>
                    <Switch
                      id={`emoji-toggle-${adaptation.platformConnectionId}`}
                      checked={useEmojis[adaptation.platformConnectionId] ?? false}
                      onCheckedChange={(checked) =>
                        onUseEmojisChange(adaptation.platformConnectionId, checked)
                      }
                      disabled={disabled || adaptation.isAdapting || isAdaptingAll}
                    />
                  </div>

                  {/* Bouton adapter avec l'IA pour cette plateforme */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => onAdaptSingle(adaptation.platformConnectionId, { useEmojis: useEmojis[adaptation.platformConnectionId] ?? false })}
                    disabled={
                      disabled ||
                      adaptation.isAdapting ||
                      isAdaptingAll ||
                      !baseContent.trim() ||
                      !clientId
                    }
                  >
                    {adaptation.isAdapting ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Adapter avec l&apos;IA pour {config.name}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
