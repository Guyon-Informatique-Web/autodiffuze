// Page de detail d'une publication (Server Component)
import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { PublicationDetail } from "@/components/dashboard/publications/PublicationDetail"

export const metadata = {
  title: "Detail de la publication",
}

interface PublicationDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function PublicationDetailPage({
  params,
}: PublicationDetailPageProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const { id } = await params

  const publication = await prisma.publication.findUnique({
    where: { id },
    include: {
      client: {
        select: {
          name: true,
          logoUrl: true,
        },
      },
      template: {
        select: {
          id: true,
          name: true,
        },
      },
      platformPublications: {
        include: {
          platformConnection: {
            select: {
              platform: true,
              platformAccountName: true,
              platformAccountId: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!publication || publication.userId !== user.id) {
    notFound()
  }

  // Serialiser les dates pour le passage au composant client
  const serializedPublication = {
    ...publication,
    scheduledAt: publication.scheduledAt?.toISOString() ?? null,
    publishedAt: publication.publishedAt?.toISOString() ?? null,
    createdAt: publication.createdAt.toISOString(),
    updatedAt: publication.updatedAt.toISOString(),
    platformPublications: publication.platformPublications.map((pp) => ({
      ...pp,
      publishedAt: pp.publishedAt?.toISOString() ?? null,
      createdAt: pp.createdAt.toISOString(),
      updatedAt: pp.updatedAt.toISOString(),
    })),
  }

  return <PublicationDetail publication={serializedPublication} />
}
