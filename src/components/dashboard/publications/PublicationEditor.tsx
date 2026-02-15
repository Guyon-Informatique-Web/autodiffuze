"use client"

// Editeur de publication -- composant principal du SaaS
// Gere la redaction, l'adaptation IA, les medias, la planification et la publication
import { useState, useCallback, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

// Composants UI
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Icones
import {
  Loader2,
  Sparkles,
  Wand2,
  CalendarIcon,
  Clock,
  Save,
  Send,
  AlertCircle,
  Users,
} from "lucide-react"

// Composants metier
import { MediaUploader } from "@/components/dashboard/MediaUploader"
import {
  PlatformPreview,
  type PlatformAdaptation,
} from "@/components/dashboard/publications/PlatformPreview"
import {
  TemplateSelector,
  type TemplateSelectorItem,
} from "@/components/dashboard/publications/TemplateSelector"

// Configuration
import { PLATFORM_CONFIG, type PlatformKey } from "@/config/platforms"
import type { PlanLimits, PlanType } from "@/config/plans"
import { cn } from "@/lib/utils"

// --- Types ---

interface ClientInfo {
  id: string
  name: string
  logoUrl: string | null
  industry: string | null
  tone: string | null
}

// Connexion plateforme telle que retournee par l'API
interface PlatformConnection {
  id: string
  platform: PlatformKey
  platformAccountName: string
  isActive: boolean
  client: {
    id: string
    name: string
    logoUrl: string | null
  }
}

// Type de contenu supporte
type ContentTypeValue = "POST" | "STORY" | "REEL" | "ARTICLE" | "THREAD"

const ALL_CONTENT_TYPES: { value: ContentTypeValue; label: string }[] = [
  { value: "POST", label: "Post" },
  { value: "STORY", label: "Story" },
  { value: "REEL", label: "Reel" },
  { value: "ARTICLE", label: "Article" },
  { value: "THREAD", label: "Thread" },
]

// Fichier media uploade
interface MediaFile {
  url: string
  type: string
  name: string
}

// Reponse de l'API de generation IA
interface AiGenerateResponse {
  content: string
  creditsRemaining: number
}

// Reponse de l'API d'adaptation IA
interface AiAdaptResponse {
  adaptedContent: string
  hashtags: string[]
  creditsRemaining: number
}

// Reponse de l'API de creation de publication
interface CreatePublicationResponse {
  publication: {
    id: string
    status: string
  }
}

// Reponse generique d'erreur API
interface ApiErrorResponse {
  error: string
}

// --- Props ---

interface PublicationEditorProps {
  clients: ClientInfo[]
  planLimits: PlanLimits
  userPlan: PlanType
  templates?: TemplateSelectorItem[]
  initialTemplate?: TemplateSelectorItem | null
}

// --- Composant principal ---

export function PublicationEditor({
  clients,
  planLimits,
  userPlan,
  templates = [],
  initialTemplate,
}: PublicationEditorProps) {
  const router = useRouter()

  // -- Etats du formulaire --
  const [selectedClientId, setSelectedClientId] = useState("")
  const [title, setTitle] = useState("")
  const [baseContent, setBaseContent] = useState("")
  const [contentType, setContentType] = useState<ContentTypeValue>("POST")
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>()
  const [scheduledTime, setScheduledTime] = useState("12:00")

  // -- Etats des plateformes --
  const [platformConnections, setPlatformConnections] = useState<
    PlatformConnection[]
  >([])
  const [loadingPlatforms, setLoadingPlatforms] = useState(false)
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<Set<string>>(
    new Set()
  )

  // -- Etats d'adaptation --
  const [adaptations, setAdaptations] = useState<PlatformAdaptation[]>([])
  const [isAdaptingAll, setIsAdaptingAll] = useState(false)

  // -- Etats IA --
  const [aiCreditsRemaining, setAiCreditsRemaining] = useState<number | null>(
    null
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [isImproving, setIsImproving] = useState(false)
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")
  const [lastAiPrompt, setLastAiPrompt] = useState("")

  // -- Etats de soumission --
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  // -- Etat du template selectionne --
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)

  // -- Application d'un template : pre-remplit les champs de l'editeur --
  const applyTemplate = useCallback(
    (template: TemplateSelectorItem) => {
      // Remplacer les variables connues dans le contenu
      const selectedClient = clients.find((c) => c.id === selectedClientId)
      const today = new Date()
      const dateStr = today.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })

      let content = template.baseContent
      if (selectedClient) {
        content = content.replace(/\{\{nom_client\}\}/g, selectedClient.name)
      }
      content = content.replace(/\{\{date\}\}/g, dateStr)
      // Marquer visuellement les variables restantes
      content = content.replace(/\{\{produit\}\}/g, "[PRODUIT]")
      content = content.replace(/\{\{lien\}\}/g, "[LIEN]")

      setBaseContent(content)
      setContentType(template.contentType as ContentTypeValue)
      setSelectedTemplateId(template.id)

      // Pre-selectionner les plateformes du template si elles existent dans les connexions du client
      if (template.platforms.length > 0 && platformConnections.length > 0) {
        const matchingIds = new Set<string>()
        const newAdaptations: PlatformAdaptation[] = []

        for (const connection of platformConnections) {
          if (template.platforms.includes(connection.platform)) {
            matchingIds.add(connection.id)
            // Ajouter une adaptation si elle n'existe pas deja
            if (!selectedPlatformIds.has(connection.id)) {
              newAdaptations.push({
                platformConnectionId: connection.id,
                platform: connection.platform,
                platformAccountName: connection.platformAccountName,
                adaptedContent: content,
                hashtags: [...template.hashtags],
                isAdapting: false,
              })
            }
          }
        }

        if (matchingIds.size > 0) {
          setSelectedPlatformIds((prev) => {
            const next = new Set(prev)
            matchingIds.forEach((id) => next.add(id))
            return next
          })
          if (newAdaptations.length > 0) {
            setAdaptations((prev) => [...prev, ...newAdaptations])
          }
        }
      }

      // Ajouter les hashtags du template aux adaptations existantes
      if (template.hashtags.length > 0) {
        setAdaptations((prev) =>
          prev.map((a) => ({
            ...a,
            hashtags:
              a.hashtags.length === 0 ? [...template.hashtags] : a.hashtags,
          }))
        )
      }
    },
    [clients, selectedClientId, platformConnections, selectedPlatformIds]
  )

  // -- Appliquer le template initial au montage --
  useEffect(() => {
    if (initialTemplate) {
      applyTemplate(initialTemplate)
    }
    // Executer uniquement au montage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // -- Aucun client : message d'invitation --
  if (clients.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">Aucun client configure</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Avant de creer une publication, vous devez d&apos;abord ajouter un
            client ou une marque a votre compte.
          </p>
          <Button asChild className="mt-6 bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-700 hover:to-blue-600">
            <Link href="/dashboard/clients/add">Ajouter un client</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  // -- Chargement des plateformes du client --
  const loadPlatforms = async (clientId: string) => {
    setLoadingPlatforms(true)
    try {
      const response = await fetch(
        `/api/platforms?clientId=${encodeURIComponent(clientId)}`
      )
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des plateformes")
      }
      const data: PlatformConnection[] = await response.json()
      // Ne garder que les connexions actives du client selectionne
      const clientConnections = data.filter(
        (c) => c.client.id === clientId && c.isActive
      )
      setPlatformConnections(clientConnections)
    } catch {
      toast.error("Impossible de charger les plateformes connectees")
      setPlatformConnections([])
    } finally {
      setLoadingPlatforms(false)
    }
  }

  // -- Changement de client : reinitialiser les plateformes et adaptations --
  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId)
    setSelectedPlatformIds(new Set())
    setAdaptations([])
    setPlatformConnections([])
    void loadPlatforms(clientId)
  }

  // -- Toggle d'une plateforme --
  const handlePlatformToggle = (connectionId: string, checked: boolean) => {
    setSelectedPlatformIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(connectionId)
      } else {
        next.delete(connectionId)
      }
      return next
    })

    // Mettre a jour les adaptations
    if (checked) {
      const connection = platformConnections.find((c) => c.id === connectionId)
      if (connection) {
        setAdaptations((prev) => [
          ...prev,
          {
            platformConnectionId: connectionId,
            platform: connection.platform,
            platformAccountName: connection.platformAccountName,
            adaptedContent: baseContent,
            hashtags: [],
            isAdapting: false,
          },
        ])
      }
    } else {
      setAdaptations((prev) =>
        prev.filter((a) => a.platformConnectionId !== connectionId)
      )
    }
  }

  // -- Types de contenu filtres selon les plateformes selectionnees --
  const availableContentTypes = useMemo(() => {
    if (selectedPlatformIds.size === 0) return ALL_CONTENT_TYPES

    const selectedPlatforms = platformConnections.filter((c) =>
      selectedPlatformIds.has(c.id)
    )

    // Intersection des types supportes par toutes les plateformes selectionnees
    const supportedTypes = ALL_CONTENT_TYPES.filter((ct) =>
      selectedPlatforms.every((conn) => {
        const config = PLATFORM_CONFIG[conn.platform]
        return config.contentTypes.includes(ct.value)
      })
    )

    return supportedTypes.length > 0 ? supportedTypes : ALL_CONTENT_TYPES
  }, [selectedPlatformIds, platformConnections])

  // Reinitialiser le type de contenu si invalide apres filtre
  useEffect(() => {
    const isCurrentTypeAvailable = availableContentTypes.some(
      (ct) => ct.value === contentType
    )
    if (!isCurrentTypeAvailable && availableContentTypes.length > 0) {
      setContentType(availableContentTypes[0].value)
    }
  }, [availableContentTypes, contentType])

  // -- Generation IA --
  const handleGenerate = async () => {
    if (!selectedClientId || !aiPrompt.trim()) return

    setIsGenerating(true)
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClientId,
          prompt: aiPrompt.trim(),
        }),
      })

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json()
        throw new Error(errorData.error ?? "Erreur lors de la generation")
      }

      const data: AiGenerateResponse = await response.json()
      setBaseContent(data.content)
      setAiCreditsRemaining(data.creditsRemaining)
      setLastAiPrompt(aiPrompt.trim())
      setGenerateDialogOpen(false)
      setAiPrompt("")
      toast.success("Contenu genere avec succes")
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la generation"
      )
    } finally {
      setIsGenerating(false)
    }
  }

  // -- Amelioration du contenu existant --
  const handleImprove = async () => {
    if (!selectedClientId || !baseContent.trim()) return

    setIsImproving(true)
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClientId,
          prompt: `Ameliore et reformule le texte suivant pour le rendre plus engageant et professionnel, tout en conservant le sens initial :\n\n${baseContent}`,
        }),
      })

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json()
        throw new Error(errorData.error ?? "Erreur lors de l'amelioration")
      }

      const data: AiGenerateResponse = await response.json()
      setBaseContent(data.content)
      setAiCreditsRemaining(data.creditsRemaining)
      toast.success("Contenu ameliore avec succes")
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'amelioration"
      )
    } finally {
      setIsImproving(false)
    }
  }

  // -- Adaptation IA pour une seule plateforme --
  const handleAdaptSingle = useCallback(
    async (platformConnectionId: string) => {
      const adaptation = adaptations.find(
        (a) => a.platformConnectionId === platformConnectionId
      )
      if (!adaptation || !baseContent.trim() || !selectedClientId) return

      // Marquer comme en cours d'adaptation
      setAdaptations((prev) =>
        prev.map((a) =>
          a.platformConnectionId === platformConnectionId
            ? { ...a, isAdapting: true }
            : a
        )
      )

      try {
        const response = await fetch("/api/ai/adapt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            baseContent,
            platform: adaptation.platform,
            clientId: selectedClientId,
          }),
        })

        if (!response.ok) {
          const errorData: ApiErrorResponse = await response.json()
          throw new Error(errorData.error ?? "Erreur lors de l'adaptation")
        }

        const data: AiAdaptResponse = await response.json()
        setAdaptations((prev) =>
          prev.map((a) =>
            a.platformConnectionId === platformConnectionId
              ? {
                  ...a,
                  adaptedContent: data.adaptedContent,
                  hashtags: data.hashtags,
                  isAdapting: false,
                }
              : a
          )
        )
        setAiCreditsRemaining(data.creditsRemaining)
        toast.success(
          `Contenu adapte pour ${PLATFORM_CONFIG[adaptation.platform].name}`
        )
      } catch (error) {
        setAdaptations((prev) =>
          prev.map((a) =>
            a.platformConnectionId === platformConnectionId
              ? { ...a, isAdapting: false }
              : a
          )
        )
        toast.error(
          error instanceof Error
            ? error.message
            : "Erreur lors de l'adaptation"
        )
      }
    },
    [adaptations, baseContent, selectedClientId]
  )

  // -- Adaptation IA pour toutes les plateformes en parallele --
  const handleAdaptAll = useCallback(async () => {
    if (!baseContent.trim() || !selectedClientId || adaptations.length === 0)
      return

    setIsAdaptingAll(true)

    // Marquer toutes les adaptations comme en cours
    setAdaptations((prev) =>
      prev.map((a) => ({ ...a, isAdapting: true }))
    )

    try {
      const promises = adaptations.map(async (adaptation) => {
        const response = await fetch("/api/ai/adapt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            baseContent,
            platform: adaptation.platform,
            clientId: selectedClientId,
          }),
        })

        if (!response.ok) {
          const errorData: ApiErrorResponse = await response.json()
          throw new Error(errorData.error ?? "Erreur")
        }

        const data: AiAdaptResponse = await response.json()
        return {
          platformConnectionId: adaptation.platformConnectionId,
          adaptedContent: data.adaptedContent,
          hashtags: data.hashtags,
          creditsRemaining: data.creditsRemaining,
        }
      })

      const results = await Promise.allSettled(promises)

      let lastCredits: number | null = null
      let successCount = 0
      let failCount = 0

      setAdaptations((prev) =>
        prev.map((a) => {
          const result = results.find((r, index) => {
            if (r.status === "fulfilled") {
              return (
                r.value.platformConnectionId === a.platformConnectionId
              )
            }
            // Pour les rejets, on utilise l'index pour identifier
            return (
              adaptations[index]?.platformConnectionId ===
              a.platformConnectionId
            )
          })

          if (result && result.status === "fulfilled") {
            lastCredits = result.value.creditsRemaining
            successCount++
            return {
              ...a,
              adaptedContent: result.value.adaptedContent,
              hashtags: result.value.hashtags,
              isAdapting: false,
            }
          }
          failCount++
          return { ...a, isAdapting: false }
        })
      )

      if (lastCredits !== null) {
        setAiCreditsRemaining(lastCredits)
      }

      if (failCount === 0) {
        toast.success(
          `Contenu adapte pour ${successCount} plateforme(s)`
        )
      } else if (successCount > 0) {
        toast.warning(
          `${successCount} adaptation(s) reussie(s), ${failCount} echouee(s)`
        )
      } else {
        toast.error("Echec de l'adaptation pour toutes les plateformes")
      }
    } catch {
      setAdaptations((prev) =>
        prev.map((a) => ({ ...a, isAdapting: false }))
      )
      toast.error("Erreur lors de l'adaptation")
    } finally {
      setIsAdaptingAll(false)
    }
  }, [adaptations, baseContent, selectedClientId])

  // -- Modification d'une adaptation (contenu ou hashtags) --
  const handleAdaptationChange = useCallback(
    (
      platformConnectionId: string,
      field: "adaptedContent" | "hashtags",
      value: string | string[]
    ) => {
      setAdaptations((prev) =>
        prev.map((a) =>
          a.platformConnectionId === platformConnectionId
            ? { ...a, [field]: value }
            : a
        )
      )
    },
    []
  )

  // -- Construction de la date/heure planifiee --
  const getScheduledDateTime = (): string | undefined => {
    if (!isScheduled || !scheduledDate) return undefined

    const [hours, minutes] = scheduledTime.split(":").map(Number)
    const dateTime = new Date(scheduledDate)
    dateTime.setHours(hours, minutes, 0, 0)

    return dateTime.toISOString()
  }

  // -- Sauvegarde comme brouillon --
  const handleSaveDraft = async () => {
    if (!selectedClientId || !baseContent.trim()) {
      toast.error("Veuillez selectionner un client et saisir un contenu")
      return
    }

    setIsSavingDraft(true)
    try {
      const body = {
        clientId: selectedClientId,
        title: title || undefined,
        baseContent,
        contentType,
        mediaUrls: mediaFiles.map((f) => f.url),
        mediaTypes: mediaFiles.map((f) => f.type),
        scheduledAt: getScheduledDateTime(),
        aiGenerated: !!lastAiPrompt,
        aiPrompt: lastAiPrompt || undefined,
        templateId: selectedTemplateId || undefined,
        platforms:
          adaptations.length > 0
            ? adaptations.map((a) => ({
                platformConnectionId: a.platformConnectionId,
                adaptedContent: a.adaptedContent || baseContent,
                hashtags: a.hashtags,
              }))
            : undefined,
      }

      const response = await fetch("/api/publications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json()
        throw new Error(errorData.error ?? "Erreur lors de la sauvegarde")
      }

      toast.success("Brouillon enregistre avec succes")
      router.push("/dashboard/publications")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la sauvegarde"
      )
    } finally {
      setIsSavingDraft(false)
    }
  }

  // -- Publication immediate ou planifiee --
  const handlePublish = async () => {
    if (!selectedClientId || !baseContent.trim()) {
      toast.error("Veuillez selectionner un client et saisir un contenu")
      return
    }

    if (adaptations.length === 0) {
      toast.error(
        "Veuillez selectionner au moins une plateforme de publication"
      )
      return
    }

    // Verifier que toutes les adaptations ont du contenu
    const emptyAdaptations = adaptations.filter(
      (a) => !a.adaptedContent.trim()
    )
    if (emptyAdaptations.length > 0) {
      toast.error(
        "Certaines plateformes n'ont pas de contenu adapte. Utilisez l'adaptation IA ou saisissez le contenu manuellement."
      )
      return
    }

    setIsPublishing(true)
    try {
      // 1. Creer la publication
      const createBody = {
        clientId: selectedClientId,
        title: title || undefined,
        baseContent,
        contentType,
        mediaUrls: mediaFiles.map((f) => f.url),
        mediaTypes: mediaFiles.map((f) => f.type),
        scheduledAt: getScheduledDateTime(),
        aiGenerated: !!lastAiPrompt,
        aiPrompt: lastAiPrompt || undefined,
        templateId: selectedTemplateId || undefined,
        platforms: adaptations.map((a) => ({
          platformConnectionId: a.platformConnectionId,
          adaptedContent: a.adaptedContent,
          hashtags: a.hashtags,
        })),
      }

      const createResponse = await fetch("/api/publications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createBody),
      })

      if (!createResponse.ok) {
        const errorData: ApiErrorResponse = await createResponse.json()
        throw new Error(errorData.error ?? "Erreur lors de la creation")
      }

      const createData: CreatePublicationResponse =
        await createResponse.json()

      // 2. Si publication immediate (pas planifiee), lancer la publication
      if (!isScheduled || !scheduledDate) {
        const publishResponse = await fetch(
          `/api/publications/${createData.publication.id}/publish`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }
        )

        if (!publishResponse.ok) {
          const errorData: ApiErrorResponse = await publishResponse.json()
          throw new Error(
            errorData.error ?? "Erreur lors de la publication"
          )
        }

        toast.success("Publication lancee avec succes")
      } else {
        toast.success("Publication planifiee avec succes")
      }

      router.push("/dashboard/publications")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la publication"
      )
    } finally {
      setIsPublishing(false)
    }
  }

  // Etat global de chargement
  const isAnyLoading =
    isSavingDraft ||
    isPublishing ||
    isGenerating ||
    isImproving ||
    isAdaptingAll

  // Planification desactivee pour le plan gratuit
  const canSchedule = planLimits.scheduling

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      {/* === COLONNE GAUCHE : Editeur (60%) === */}
      <div className="space-y-6 lg:col-span-3">
        {/* Selecteur de client */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client-select">Client / Marque</Label>
              <Select
                value={selectedClientId}
                onValueChange={handleClientChange}
                disabled={isAnyLoading}
              >
                <SelectTrigger id="client-select" className="w-full">
                  <SelectValue placeholder="Selectionner un client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      <span className="flex items-center gap-2">
                        {client.name}
                        {client.industry && (
                          <span className="text-xs text-muted-foreground">
                            ({client.industry})
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selecteur de template */}
            {templates.length > 0 && (
              <TemplateSelector
                templates={templates}
                onSelect={applyTemplate}
                disabled={isAnyLoading}
              />
            )}

            {/* Titre interne optionnel */}
            <div className="space-y-2">
              <Label htmlFor="title">Titre interne (optionnel)</Label>
              <Input
                id="title"
                placeholder="Titre interne pour retrouver facilement cette publication..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isAnyLoading}
                maxLength={200}
              />
            </div>
          </CardContent>
        </Card>

        {/* Zone de texte principale */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Contenu de base</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Textarea
                placeholder="Redigez le contenu de votre publication..."
                value={baseContent}
                onChange={(e) => setBaseContent(e.target.value)}
                disabled={isAnyLoading}
                className="min-h-[200px] resize-y"
              />
              {/* Compteur de caracteres */}
              <div className="absolute bottom-2 right-3 text-xs text-muted-foreground pointer-events-none">
                {baseContent.length.toLocaleString()} caractere(s)
              </div>
            </div>

            {/* Boutons IA */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Bouton Generer avec l'IA */}
              <Dialog
                open={generateDialogOpen}
                onOpenChange={setGenerateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!selectedClientId || isAnyLoading}
                  >
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    Generer avec l&apos;IA
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generer du contenu avec l&apos;IA</DialogTitle>
                    <DialogDescription>
                      Decrivez le contenu que vous souhaitez generer. L&apos;IA
                      generera un texte adapte a votre marque.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 py-4">
                    <Textarea
                      placeholder="Ex : Un post promotionnel pour notre nouvelle collection d'ete, ton dynamique et jeune..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="min-h-[120px]"
                      maxLength={1000}
                      disabled={isGenerating}
                    />
                    <p className="text-xs text-muted-foreground">
                      {aiPrompt.length} / 1000 caracteres
                    </p>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleGenerate}
                      disabled={
                        isGenerating ||
                        aiPrompt.trim().length < 10
                      }
                      className="bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-700 hover:to-blue-600"
                    >
                      {isGenerating ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-1.5 h-4 w-4" />
                      )}
                      Generer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Bouton Ameliorer */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleImprove}
                disabled={
                  !selectedClientId ||
                  !baseContent.trim() ||
                  isAnyLoading
                }
              >
                {isImproving ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                )}
                Ameliorer
              </Button>

              {/* Credits IA restants */}
              {aiCreditsRemaining !== null && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {aiCreditsRemaining} credit(s) IA restant(s)
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upload de medias */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Medias</CardTitle>
          </CardHeader>
          <CardContent>
            <MediaUploader
              value={mediaFiles}
              onChange={setMediaFiles}
              maxFiles={planLimits.maxMediaPerPublication}
              maxSizeMB={planLimits.maxMediaSizeMB}
              disabled={isAnyLoading}
            />
          </CardContent>
        </Card>

        {/* Type de contenu */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Type de contenu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availableContentTypes.map((ct) => (
                <Button
                  key={ct.value}
                  type="button"
                  variant={contentType === ct.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setContentType(ct.value)}
                  disabled={isAnyLoading}
                  className={cn(
                    contentType === ct.value &&
                      "bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-700 hover:to-blue-600"
                  )}
                >
                  {ct.label}
                </Button>
              ))}
            </div>
            {selectedPlatformIds.size > 0 &&
              availableContentTypes.length < ALL_CONTENT_TYPES.length && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Filtres selon les plateformes selectionnees
                </p>
              )}
          </CardContent>
        </Card>

        {/* Selection des plateformes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Plateformes cibles</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedClientId ? (
              <div className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Selectionnez un client pour voir les plateformes connectees.
              </div>
            ) : loadingPlatforms ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-5 w-9" />
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            ) : platformConnections.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                <AlertCircle className="h-5 w-5" />
                <p>Aucune plateforme connectee pour ce client.</p>
                <Button variant="link" size="sm" asChild className="text-violet-600">
                  <Link href="/dashboard/platforms">
                    Connecter une plateforme
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {platformConnections.map((connection) => {
                  const config = PLATFORM_CONFIG[connection.platform]
                  const isSelected = selectedPlatformIds.has(connection.id)

                  return (
                    <div
                      key={connection.id}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                        isSelected
                          ? "border-primary/30 bg-primary/5"
                          : "border-transparent hover:bg-muted/50"
                      )}
                    >
                      <Switch
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handlePlatformToggle(connection.id, checked)
                        }
                        disabled={isAnyLoading}
                      />
                      <span
                        className="inline-block h-3.5 w-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: config.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {config.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {connection.platformAccountName}
                        </p>
                      </div>
                      {isSelected && (
                        <Badge
                          variant="outline"
                          className="shrink-0 text-xs"
                          style={{
                            borderColor: config.color,
                            color: config.color,
                          }}
                        >
                          Active
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Planification */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Planification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!canSchedule ? (
              <div className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <div>
                  La planification n&apos;est pas disponible avec votre plan
                  actuel.{" "}
                  <Link
                    href="/dashboard/settings/billing"
                    className="font-medium text-violet-600 hover:underline"
                  >
                    Passer au plan Pro
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Toggle planification */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="schedule-toggle">Planifier la publication</Label>
                    <p className="text-xs text-muted-foreground">
                      {isScheduled
                        ? "La publication sera envoyee a la date et l'heure choisies"
                        : "La publication sera publiee immediatement"}
                    </p>
                  </div>
                  <Switch
                    id="schedule-toggle"
                    checked={isScheduled}
                    onCheckedChange={setIsScheduled}
                    disabled={isAnyLoading}
                  />
                </div>

                {/* Date et heure de planification */}
                {isScheduled && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Selecteur de date */}
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !scheduledDate && "text-muted-foreground"
                            )}
                            disabled={isAnyLoading}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {scheduledDate
                              ? format(scheduledDate, "PPP", { locale: fr })
                              : "Choisir une date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={scheduledDate}
                            onSelect={setScheduledDate}
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Selecteur d'heure */}
                    <div className="space-y-2">
                      <Label htmlFor="schedule-time">Heure</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="schedule-time"
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="pl-10"
                          disabled={isAnyLoading}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* === COLONNE DROITE : Previsualisation (40%) === */}
      <div className="lg:col-span-2">
        <div className="lg:sticky lg:top-6">
          <PlatformPreview
            adaptations={adaptations}
            baseContent={baseContent}
            clientId={selectedClientId}
            onAdaptationChange={handleAdaptationChange}
            onAdaptSingle={handleAdaptSingle}
            onAdaptAll={handleAdaptAll}
            isAdaptingAll={isAdaptingAll}
            disabled={isAnyLoading}
          />
        </div>
      </div>

      {/* === BARRE D'ACTIONS EN BAS (sticky sur mobile) === */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background p-4 md:relative md:left-auto md:border-0 md:bg-transparent md:p-0 lg:col-span-5">
        <div className="mx-auto flex flex-wrap items-center justify-end gap-3 max-w-7xl">
          {/* Brouillon */}
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={
              isAnyLoading || !selectedClientId || !baseContent.trim()
            }
          >
            {isSavingDraft ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            Enregistrer comme brouillon
          </Button>

          {/* Publication / Planification */}
          <Button
            onClick={handlePublish}
            disabled={
              isAnyLoading ||
              !selectedClientId ||
              !baseContent.trim() ||
              adaptations.length === 0 ||
              (isScheduled && (!scheduledDate || !canSchedule))
            }
            className="bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-700 hover:to-blue-600"
          >
            {isPublishing ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-1.5 h-4 w-4" />
            )}
            {isScheduled && scheduledDate
              ? "Planifier la publication"
              : "Publier maintenant"}
          </Button>
        </div>
      </div>
    </div>
  )
}
