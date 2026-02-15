// API route pour la liste et la creation de publications
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { createPublicationSchema } from "@/lib/validations/publication"
import { getPlanLimits } from "@/config/plans"
import type { PlanType } from "@/config/plans"
import type { Prisma, PublicationStatus, PlatformType } from "@/generated/prisma/client"

// Statuts de publication valides pour le filtrage
const VALID_STATUSES: PublicationStatus[] = [
  "DRAFT",
  "SCHEDULED",
  "PUBLISHING",
  "PUBLISHED",
  "PARTIAL",
  "FAILED",
]

// Plateformes valides pour le filtrage
const VALID_PLATFORMS: PlatformType[] = [
  "FACEBOOK",
  "INSTAGRAM",
  "LINKEDIN",
  "X",
  "TIKTOK",
]

// GET : Liste paginee des publications de l'utilisateur connecte
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser()

    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
    const perPage = 20
    const skip = (page - 1) * perPage

    // Construction des filtres
    const clientId = searchParams.get("clientId")
    const status = searchParams.get("status")
    const platform = searchParams.get("platform")

    const where: Prisma.PublicationWhereInput = {
      userId: user.id,
    }

    if (clientId) {
      where.clientId = clientId
    }

    if (status && VALID_STATUSES.includes(status as PublicationStatus)) {
      where.status = status as PublicationStatus
    }

    if (platform && VALID_PLATFORMS.includes(platform as PlatformType)) {
      where.platformPublications = {
        some: {
          platformConnection: {
            platform: platform as PlatformType,
          },
        },
      }
    }

    const [publications, total] = await Promise.all([
      prisma.publication.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: perPage,
        include: {
          client: {
            select: {
              name: true,
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
      }),
      prisma.publication.count({ where }),
    ])

    return NextResponse.json({
      publications,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    })
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

// POST : Creer une nouvelle publication
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser()

    const body: unknown = await request.json()
    const validation = createPublicationSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const data = validation.data

    // Verification que le client appartient a l'utilisateur
    const client = await prisma.client.findUnique({
      where: { id: data.clientId },
      select: { userId: true },
    })

    if (!client) {
      return NextResponse.json(
        { error: "Client introuvable" },
        { status: 404 }
      )
    }

    if (client.userId !== user.id) {
      return NextResponse.json({ error: "Acces interdit" }, { status: 403 })
    }

    // Verification de la limite du plan (publications du mois en cours)
    const planLimits = getPlanLimits(user.plan as PlanType)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const publicationsThisMonth = await prisma.publication.count({
      where: {
        userId: user.id,
        createdAt: { gte: startOfMonth },
      },
    })

    if (publicationsThisMonth >= planLimits.maxPublicationsPerMonth) {
      return NextResponse.json(
        {
          error: `Limite atteinte : votre plan permet ${planLimits.maxPublicationsPerMonth} publication(s) par mois. Passez a un plan superieur pour en creer davantage.`,
        },
        { status: 403 }
      )
    }

    // Determiner le statut initial
    const initialStatus =
      data.scheduledAt && new Date(data.scheduledAt) > new Date()
        ? "SCHEDULED"
        : "DRAFT"

    // Creation de la publication avec les platformPublications si fournies
    const publication = await prisma.publication.create({
      data: {
        userId: user.id,
        clientId: data.clientId,
        title: data.title || null,
        baseContent: data.baseContent,
        contentType: data.contentType,
        mediaUrls: data.mediaUrls ?? [],
        mediaTypes: data.mediaTypes ?? [],
        status: initialStatus,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        aiGenerated: data.aiGenerated ?? false,
        aiPrompt: data.aiPrompt || null,
        templateId: data.templateId || null,
        ...(data.platforms && data.platforms.length > 0
          ? {
              platformPublications: {
                create: data.platforms.map((p) => ({
                  platformConnectionId: p.platformConnectionId,
                  adaptedContent: p.adaptedContent,
                  hashtags: p.hashtags ?? [],
                  mediaUrls: data.mediaUrls ?? [],
                })),
              },
            }
          : {}),
      },
      include: {
        client: {
          select: {
            name: true,
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

    return NextResponse.json({ publication }, { status: 201 })
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
