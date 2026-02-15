// Page de gestion des plateformes connectees
import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Link2, Plus, Unplug } from "lucide-react"
import { PlatformConnectionCard } from "@/components/dashboard/platforms/PlatformConnectionCard"
import type { PlatformKey } from "@/config/platforms"

export const metadata = {
  title: "Plateformes",
}

// Type pour les connexions groupees par client
interface ClientGroup {
  clientId: string
  clientName: string
  clientLogoUrl: string | null
  connections: Array<{
    id: string
    platform: PlatformKey
    platformAccountName: string
    isActive: boolean
    tokenExpiresAt: string | null
    lastUsedAt: string | null
    errorMessage: string | null
  }>
}

export default async function PlatformsPage() {
  let user

  try {
    user = await requireUser()
  } catch {
    redirect("/login")
  }

  // Recuperer toutes les connexions plateformes de l'utilisateur
  const connections = await prisma.platformConnection.findMany({
    where: { userId: user.id },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
        },
      },
    },
    orderBy: [
      { client: { name: "asc" } },
      { platform: "asc" },
    ],
  })

  // Grouper les connexions par client
  const clientGroups: ClientGroup[] = []
  const clientMap = new Map<string, ClientGroup>()

  for (const connection of connections) {
    let group = clientMap.get(connection.clientId)

    if (!group) {
      group = {
        clientId: connection.client.id,
        clientName: connection.client.name,
        clientLogoUrl: connection.client.logoUrl,
        connections: [],
      }
      clientMap.set(connection.clientId, group)
      clientGroups.push(group)
    }

    group.connections.push({
      id: connection.id,
      platform: connection.platform as PlatformKey,
      platformAccountName: connection.platformAccountName,
      isActive: connection.isActive,
      tokenExpiresAt: connection.tokenExpiresAt?.toISOString() ?? null,
      lastUsedAt: connection.lastUsedAt?.toISOString() ?? null,
      errorMessage: connection.errorMessage,
    })
  }

  // Etat vide : aucune connexion
  if (clientGroups.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Plateformes</h1>
            <p className="text-muted-foreground">
              Gerez vos connexions aux reseaux sociaux
            </p>
          </div>
        </div>

        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Unplug className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                Aucune plateforme connectee
              </h3>
              <p className="mb-6 max-w-md text-sm text-muted-foreground">
                Connectez vos reseaux sociaux pour commencer a diffuser vos
                publications automatiquement sur toutes vos plateformes.
              </p>
              <Button asChild>
                <Link href="/dashboard/clients">
                  <Plus className="h-4 w-4" />
                  Acceder a mes clients
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tete */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Plateformes</h1>
          <p className="text-muted-foreground">
            Gerez vos connexions aux reseaux sociaux
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link2 className="h-4 w-4" />
          {connections.length} connexion{connections.length > 1 ? "s" : ""}
        </div>
      </div>

      {/* Groupes par client */}
      <div className="space-y-6">
        {clientGroups.map((group) => (
          <Card key={group.clientId}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Avatar size="default">
                  {group.clientLogoUrl ? (
                    <AvatarImage
                      src={group.clientLogoUrl}
                      alt={group.clientName}
                    />
                  ) : null}
                  <AvatarFallback>
                    {group.clientName
                      .split(" ")
                      .map((word) => word[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{group.clientName}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {group.connections.length} plateforme
                    {group.connections.length > 1 ? "s" : ""} connectee
                    {group.connections.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {group.connections.map((connection) => (
                  <PlatformConnectionCard
                    key={connection.id}
                    connection={connection}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
