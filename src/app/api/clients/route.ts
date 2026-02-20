// API route pour la liste et la creation de clients
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { createClientSchema } from "@/lib/validations/client"
import { getPlanLimits } from "@/config/plans"
import type { PlanType } from "@/config/plans"
import { withErrorHandling } from "@/lib/api-error-handler"

// GET : Liste les clients de l'utilisateur connecte (paginee)
export const GET = withErrorHandling(async (request: NextRequest) => {
  try {
    const user = await requireUser()

    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
    const perPage = 20
    const skip = (page - 1) * perPage

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: perPage,
        include: {
          _count: {
            select: {
              platformConnections: true,
              publications: true,
            },
          },
        },
      }),
      prisma.client.count({
        where: { userId: user.id },
      }),
    ])

    return NextResponse.json({
      clients,
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
});

// POST : Creer un nouveau client
export const POST = withErrorHandling(async (request: NextRequest) => {
  try {
    const user = await requireUser()

    // Verification de la limite du plan
    const planLimits = getPlanLimits(user.plan as PlanType, user.isAdmin)
    const clientCount = await prisma.client.count({
      where: { userId: user.id },
    })

    if (clientCount >= planLimits.maxClients) {
      return NextResponse.json(
        {
          error: `Limite atteinte : votre plan permet ${planLimits.maxClients} client(s) maximum. Passez a un plan superieur pour en ajouter davantage.`,
        },
        { status: 403 }
      )
    }

    const body: unknown = await request.json()
    const validation = createClientSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const data = validation.data

    const client = await prisma.client.create({
      data: {
        userId: user.id,
        name: data.name,
        description: data.description || null,
        website: data.website || null,
        industry: data.industry || null,
        tone: data.tone || null,
        targetAudience: data.targetAudience || null,
        logoUrl: data.logoUrl || null,
      },
    })

    return NextResponse.json({ client }, { status: 201 })
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
