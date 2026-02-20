// API route pour publier immediatement une publication
// Cree les jobs puis les traite dans la foulee (pas d'attente du cron)
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { processPublishJob, updatePublicationStatus } from "@/lib/publishers/processor"
import { withErrorHandling } from "@/lib/api-error-handler"

// Laisser le temps aux publishers (upload media, appels API externes)
export const maxDuration = 120

// Nombre max de passes de retries pour rester dans la limite Vercel
const MAX_RETRY_PASSES = 3

// POST : Lancer la publication immediate
export const POST = withErrorHandling(async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
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
    await prisma.$transaction(async (tx) => {
      // Mettre le statut de la publication a PUBLISHING
      await tx.publication.update({
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
    })

    // --- Traitement immediat des jobs ---
    // Recuperer les jobs PENDING crees pour cette publication
    const pendingJobs = await prisma.publishJob.findMany({
      where: { publicationId: id, status: "PENDING" },
      select: { id: true },
    })

    // Traiter chaque job sequentiellement (eviter de surcharger les APIs)
    for (const job of pendingJobs) {
      await processPublishJob(job.id)
    }

    // Boucle de retries : re-traiter les jobs qui ont echoue et sont prets a retenter
    for (let pass = 0; pass < MAX_RETRY_PASSES; pass++) {
      const retryableJobs = await prisma.publishJob.findMany({
        where: {
          publicationId: id,
          status: "PENDING",
          nextRetryAt: { lte: new Date() },
        },
        select: { id: true },
      })

      if (retryableJobs.length === 0) break

      for (const job of retryableJobs) {
        await processPublishJob(job.id)
      }
    }

    // Calculer le statut final de la publication
    await updatePublicationStatus(id)

    // Retourner la publication avec le statut mis a jour
    const updated = await prisma.publication.findUnique({
      where: { id },
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
});
