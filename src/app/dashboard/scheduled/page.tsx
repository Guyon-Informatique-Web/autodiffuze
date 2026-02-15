// Page des publications planifiees -- Server Component
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ScheduledContent } from "@/components/dashboard/scheduled/ScheduledContent"

export const metadata = {
  title: "Publications planifiees",
}

export default async function ScheduledPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  // Recuperer les publications planifiees de l'utilisateur avec les relations
  const publications = await prisma.publication.findMany({
    where: {
      userId: user.id,
      status: "SCHEDULED",
    },
    orderBy: { scheduledAt: "asc" },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
        },
      },
      platformPublications: {
        include: {
          platformConnection: {
            select: {
              platform: true,
              platformAccountName: true,
            },
          },
        },
      },
    },
  })

  // Serialiser les dates pour le passage au Client Component
  const serializedPublications = publications.map((pub) => ({
    id: pub.id,
    title: pub.title,
    baseContent: pub.baseContent,
    scheduledAt: pub.scheduledAt?.toISOString() ?? null,
    createdAt: pub.createdAt.toISOString(),
    client: {
      id: pub.client.id,
      name: pub.client.name,
      logoUrl: pub.client.logoUrl,
    },
    platforms: pub.platformPublications.map((pp) => ({
      id: pp.id,
      platform: pp.platformConnection.platform,
      accountName: pp.platformConnection.platformAccountName,
    })),
  }))

  return <ScheduledContent publications={serializedPublications} />
}
