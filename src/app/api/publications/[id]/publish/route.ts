// API route pour publier immediatement une publication
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST : Lancer la publication immediate
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser()
    const { id } = await params

    // Recuperer la publication avec ses platformPublications
    const publication = await prisma.publication.findUnique({
      where: { id },
      include: {
        platformPublications: true,
      },
    })

    if (!publication) {
      return NextResponse.json(
        { error: "Publication introuvable" },
        { status: 404 }
      )
    }

    if (publication.userId !== user.id) {
      return NextResponse.json({ error: "Acces interdit" }, { status: 403 })
    }

    // Verifier que la publication est en brouillon ou planifiee
    if (publication.status !== "DRAFT" && publication.status !== "SCHEDULED") {
      return NextResponse.json(
        {
          error:
            "Seules les publications en brouillon ou planifiees peuvent etre publiees",
        },
        { status: 400 }
      )
    }

    // Verifier qu'il y a au moins une platformPublication
    if (publication.platformPublications.length === 0) {
      return NextResponse.json(
        {
          error:
            "La publication doit avoir au moins une plateforme cible pour etre publiee",
        },
        { status: 400 }
      )
    }

    // Mise a jour de la publication et des platformPublications dans une transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Mettre le statut de la publication a PUBLISHING
      const updatedPublication = await tx.publication.update({
        where: { id },
        data: { status: "PUBLISHING" },
      })

      // Mettre le statut de chaque platformPublication a PUBLISHING
      await tx.platformPublication.updateMany({
        where: {
          publicationId: id,
          status: "PENDING",
        },
        data: { status: "PUBLISHING" },
      })

      // Creer un PublishJob pour chaque platformPublication
      const publishJobs = publication.platformPublications.map((pp) => ({
        publicationId: id,
        platformPublicationId: pp.id,
        status: "PENDING" as const,
      }))

      await tx.publishJob.createMany({
        data: publishJobs,
      })

      // Retourner la publication mise a jour avec les relations
      return tx.publication.findUnique({
        where: { id: updatedPublication.id },
        include: {
          client: {
            select: {
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
                  platformAccountId: true,
                },
              },
            },
          },
        },
      })
    })

    return NextResponse.json({ publication: updated })
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifie") {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
