// Cron job de publication automatique
// Traite les publications programmees et les jobs en attente de retry
// Appele par Vercel Cron (ou equivalent) via GET avec authentification par CRON_SECRET
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { processPublishJob, updatePublicationStatus } from "@/lib/publishers/processor"

export const dynamic = "force-dynamic"
export const maxDuration = 300 // 5 minutes max pour le cron

export async function GET(request: Request) {
  // Verifier l'authentification du cron
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error("CRON_SECRET non configure dans les variables d'environnement")
    return NextResponse.json(
      { error: "Configuration serveur manquante" },
      { status: 500 }
    )
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Non autorise" },
      { status: 401 }
    )
  }

  const now = new Date()
  let scheduledCount = 0
  let processedCount = 0
  let succeededCount = 0
  let failedCount = 0

  try {
    // Etape 1 : Recuperer les publications programmees dont l'heure est passee
    const scheduledPublications = await prisma.publication.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: {
          lte: now,
        },
      },
      include: {
        platformPublications: {
          include: {
            platformConnection: true,
          },
        },
      },
    })

    scheduledCount = scheduledPublications.length

    // Etape 2 : Pour chaque publication programmee, creer les jobs
    for (const publication of scheduledPublications) {
      // Passer la publication en status PUBLISHING
      await prisma.publication.update({
        where: { id: publication.id },
        data: { status: "PUBLISHING" },
      })

      for (const platformPub of publication.platformPublications) {
        // Verifier que la connexion est active avant de creer un job
        if (!platformPub.platformConnection.isActive) {
          await prisma.platformPublication.update({
            where: { id: platformPub.id },
            data: {
              status: "FAILED",
              errorMessage: `Connexion ${platformPub.platformConnection.platform} inactive`,
            },
          })
          continue
        }

        // Mettre la publication plateforme en PUBLISHING
        await prisma.platformPublication.update({
          where: { id: platformPub.id },
          data: { status: "PUBLISHING" },
        })

        // Creer le job de publication
        await prisma.publishJob.create({
          data: {
            publicationId: publication.id,
            platformPublicationId: platformPub.id,
            status: "PENDING",
          },
        })
      }
    }

    // Etape 3 : Recuperer les jobs en attente de traitement
    // Inclut les nouveaux jobs et les retries dont le delai est ecoule
    const pendingJobs = await prisma.publishJob.findMany({
      where: {
        status: "PENDING",
        OR: [
          { nextRetryAt: null },
          { nextRetryAt: { lte: now } },
        ],
      },
      orderBy: { createdAt: "asc" },
    })

    // Etape 4 : Traiter chaque job
    for (const job of pendingJobs) {
      processedCount++

      try {
        await processPublishJob(job.id)

        // Relire le job pour connaitre son statut final
        const updatedJob = await prisma.publishJob.findUnique({
          where: { id: job.id },
          select: { status: true },
        })

        if (updatedJob?.status === "COMPLETED") {
          succeededCount++
        } else if (updatedJob?.status === "FAILED") {
          failedCount++
        }
        // Si le job est retourne en PENDING (retry programme), il sera traite au prochain cron
      } catch (error) {
        failedCount++
        console.error(`Erreur inattendue lors du traitement du job ${job.id} :`, error)
      }
    }

    // Etape 5 : Mettre a jour le statut global des publications concernees
    // Collecter les IDs de publication uniques
    const publicationIds = new Set<string>()

    for (const publication of scheduledPublications) {
      publicationIds.add(publication.id)
    }
    for (const job of pendingJobs) {
      publicationIds.add(job.publicationId)
    }

    for (const publicationId of publicationIds) {
      try {
        await updatePublicationStatus(publicationId)
      } catch (error) {
        console.error(`Erreur mise a jour statut publication ${publicationId} :`, error)
      }
    }

    return NextResponse.json({
      success: true,
      scheduled: scheduledCount,
      processed: processedCount,
      succeeded: succeededCount,
      failed: failedCount,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error("Erreur critique dans le cron de publication :", error)
    return NextResponse.json(
      {
        error: "Erreur interne du cron de publication",
        scheduled: scheduledCount,
        processed: processedCount,
        succeeded: succeededCount,
        failed: failedCount,
      },
      { status: 500 }
    )
  }
}
