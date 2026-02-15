// Page de detail d'un client (Server Component)
import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { ClientDetailContent } from "./ClientDetailContent"

export const metadata = {
  title: "Detail du client",
}

interface ClientDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const { id } = await params

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      platformConnections: {
        orderBy: { createdAt: "desc" },
      },
      publications: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      _count: {
        select: {
          publications: true,
          platformConnections: true,
        },
      },
    },
  })

  if (!client || client.userId !== user.id) {
    notFound()
  }

  // Comptage des publications par plateforme (via les platformPublications)
  const publicationsByPlatform = await prisma.platformPublication.groupBy({
    by: ["platformConnectionId"],
    where: {
      publication: {
        clientId: client.id,
      },
    },
    _count: true,
  })

  // Construire la repartition par plateforme
  const platformStats = client.platformConnections.map((conn) => {
    const count = publicationsByPlatform.find(
      (p) => p.platformConnectionId === conn.id
    )
    return {
      platform: conn.platform,
      accountName: conn.platformAccountName,
      count: count?._count ?? 0,
    }
  })

  // Serialiser les dates pour le composant client
  const serializedClient = {
    ...client,
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
    platformConnections: client.platformConnections.map((conn) => ({
      ...conn,
      tokenExpiresAt: conn.tokenExpiresAt?.toISOString() ?? null,
      lastUsedAt: conn.lastUsedAt?.toISOString() ?? null,
      createdAt: conn.createdAt.toISOString(),
      updatedAt: conn.updatedAt.toISOString(),
    })),
    publications: client.publications.map((pub) => ({
      ...pub,
      scheduledAt: pub.scheduledAt?.toISOString() ?? null,
      publishedAt: pub.publishedAt?.toISOString() ?? null,
      createdAt: pub.createdAt.toISOString(),
      updatedAt: pub.updatedAt.toISOString(),
    })),
  }

  return (
    <ClientDetailContent
      client={serializedClient}
      platformStats={platformStats}
    />
  )
}
