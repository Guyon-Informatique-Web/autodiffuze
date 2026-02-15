"use client"

// Contenu principal de la page historique des publications
// Gere les filtres (client, statut, plateforme), la liste paginee et les etats vides
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FileText,
  PenSquare,
  ChevronLeft,
  ChevronRight,
  SearchX,
} from "lucide-react"
import {
  PublicationCard,
  type PublicationData,
} from "@/components/dashboard/publications/PublicationCard"
// Types Prisma utilises dans PublicationData (re-exporte depuis PublicationCard)

// Type pour un client dans la liste de filtres
interface ClientOption {
  id: string
  name: string
}

// Type pour la reponse paginee de l'API
interface PaginatedResponse {
  publications: PublicationData[]
  pagination: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
}

// Options de statut pour le filtre
const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "ALL", label: "Tous les statuts" },
  { value: "DRAFT", label: "Brouillon" },
  { value: "SCHEDULED", label: "Planifie" },
  { value: "PUBLISHING", label: "En cours" },
  { value: "PUBLISHED", label: "Publie" },
  { value: "PARTIAL", label: "Partiel" },
  { value: "FAILED", label: "Echoue" },
]

// Options de plateforme pour le filtre
const PLATFORM_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "ALL", label: "Toutes les plateformes" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "X", label: "X" },
  { value: "TIKTOK", label: "TikTok" },
]

interface PublicationsContentProps {
  clients: ClientOption[]
}

export function PublicationsContent({ clients }: PublicationsContentProps) {
  // Etats des filtres
  const [selectedClient, setSelectedClient] = useState("ALL")
  const [selectedStatus, setSelectedStatus] = useState("ALL")
  const [selectedPlatform, setSelectedPlatform] = useState("ALL")

  // Etats de la pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)

  // Etats des donnees
  const [publications, setPublications] = useState<PublicationData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Determiner si des filtres sont actifs (pour l'etat vide)
  const hasActiveFilters =
    selectedClient !== "ALL" ||
    selectedStatus !== "ALL" ||
    selectedPlatform !== "ALL"

  // Charger les publications depuis l'API
  const fetchPublications = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", page.toString())

      if (selectedClient !== "ALL") {
        params.set("clientId", selectedClient)
      }
      if (selectedStatus !== "ALL") {
        params.set("status", selectedStatus)
      }
      if (selectedPlatform !== "ALL") {
        params.set("platform", selectedPlatform)
      }

      const response = await fetch(`/api/publications?${params.toString()}`)

      if (response.ok) {
        const data = (await response.json()) as PaginatedResponse
        setPublications(data.publications)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
      }
    } catch {
      // Erreur silencieuse, les publications resteront vides
    } finally {
      setIsLoading(false)
    }
  }, [page, selectedClient, selectedStatus, selectedPlatform])

  // Recharger les publications quand les filtres ou la page changent
  useEffect(() => {
    void fetchPublications()
  }, [fetchPublications])

  // Quand un filtre change, revenir a la page 1
  function handleFilterChange(
    setter: (value: string) => void,
    value: string
  ) {
    setter(value)
    setPage(1)
  }

  // Callback apres suppression d'une publication
  function handlePublicationDeleted() {
    void fetchPublications()
  }

  return (
    <div className="space-y-6">
      {/* En-tete */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Publications</h1>
          <p className="text-muted-foreground">
            Historique et suivi de toutes vos publications
          </p>
        </div>
        <Button
          asChild
          className="bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-700 hover:to-blue-600"
        >
          <Link href="/dashboard/create">
            <PenSquare className="mr-2 h-4 w-4" />
            Nouvelle publication
          </Link>
        </Button>
      </div>

      {/* Barre de filtres */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Filtre par client */}
        <Select
          value={selectedClient}
          onValueChange={(value) =>
            handleFilterChange(setSelectedClient, value)
          }
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Tous les clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les clients</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtre par statut */}
        <Select
          value={selectedStatus}
          onValueChange={(value) =>
            handleFilterChange(setSelectedStatus, value)
          }
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtre par plateforme */}
        <Select
          value={selectedPlatform}
          onValueChange={(value) =>
            handleFilterChange(setSelectedPlatform, value)
          }
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Toutes les plateformes" />
          </SelectTrigger>
          <SelectContent>
            {PLATFORM_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Contenu : chargement, liste ou etat vide */}
      {isLoading ? (
        // Squelettes de chargement
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : publications.length === 0 && !hasActiveFilters ? (
        // Etat vide sans filtres : aucune publication du tout
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-950">
                <FileText className="h-8 w-8 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                Aucune publication
              </h3>
              <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                Vous n&apos;avez pas encore cree de publication. Lancez-vous et
                creez votre premier contenu a diffuser sur vos plateformes.
              </p>
              <Button
                asChild
                className="bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-700 hover:to-blue-600"
              >
                <Link href="/dashboard/create">
                  <PenSquare className="mr-2 h-4 w-4" />
                  Creer ma premiere publication
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : publications.length === 0 && hasActiveFilters ? (
        // Etat vide avec filtres : aucun resultat correspondant
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <SearchX className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Aucun resultat</h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                Aucune publication ne correspond aux filtres selectionnes.
                Essayez de modifier vos criteres de recherche.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Liste des publications
        <>
          <div className="space-y-3">
            {publications.map((publication) => (
              <PublicationCard
                key={publication.id}
                publication={publication}
                onDeleted={handlePublicationDeleted}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {total} publication{total > 1 ? "s" : ""} au total
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Precedent
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} sur {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Suivant
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
