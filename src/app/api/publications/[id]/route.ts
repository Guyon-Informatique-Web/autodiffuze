// API route pour le detail, la modification et la suppression d'une publication
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { updatePublicationSchema } from "@/lib/validations/publication"

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET : Detail d'une publication avec ses platformPublications et client
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser()
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

    if (!publication) {
      return NextResponse.json(
        { error: "Publication introuvable" },
        { status: 404 }
      )
    }

    if (publication.userId !== user.id) {
      return NextResponse.json({ error: "Acces interdit" }, { status: 403 })
    }

    return NextResponse.json({ publication })
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

// PATCH : Modifier une publication (brouillon uniquement)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser()
    const { id } = await params

    // Verification de l'appartenance et du statut
    const existing = await prisma.publication.findUnique({
      where: { id },
      select: { userId: true, status: true },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Publication introuvable" },
        { status: 404 }
      )
    }

    if (existing.userId !== user.id) {
      return NextResponse.json({ error: "Acces interdit" }, { status: 403 })
    }

    if (existing.status !== "DRAFT") {
      return NextResponse.json(
        {
          error:
            "Seules les publications en brouillon peuvent etre modifiees",
        },
        { status: 400 }
      )
    }

    const body: unknown = await request.json()
    const validation = updatePublicationSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const data = validation.data

    // Determiner le nouveau statut si scheduledAt est fourni
    let newStatus: "DRAFT" | "SCHEDULED" | undefined
    if (data.scheduledAt !== undefined) {
      newStatus =
        data.scheduledAt && new Date(data.scheduledAt) > new Date()
          ? "SCHEDULED"
          : "DRAFT"
    }

    // Si platforms est fourni, supprimer les anciens et recreer
    if (data.platforms) {
      await prisma.platformPublication.deleteMany({
        where: { publicationId: id },
      })
    }

    const publication = await prisma.publication.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title || null }),
        ...(data.baseContent !== undefined && {
          baseContent: data.baseContent,
        }),
        ...(data.contentType !== undefined && {
          contentType: data.contentType,
        }),
        ...(data.mediaUrls !== undefined && { mediaUrls: data.mediaUrls }),
        ...(data.mediaTypes !== undefined && { mediaTypes: data.mediaTypes }),
        ...(data.scheduledAt !== undefined && {
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        }),
        ...(newStatus !== undefined && { status: newStatus }),
        ...(data.aiGenerated !== undefined && {
          aiGenerated: data.aiGenerated,
        }),
        ...(data.aiPrompt !== undefined && {
          aiPrompt: data.aiPrompt || null,
        }),
        ...(data.templateId !== undefined && {
          templateId: data.templateId || null,
        }),
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

    return NextResponse.json({ publication })
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

// DELETE : Supprimer une publication (cascade geree par Prisma)
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser()
    const { id } = await params

    // Verification de l'appartenance
    const existing = await prisma.publication.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Publication introuvable" },
        { status: 404 }
      )
    }

    if (existing.userId !== user.id) {
      return NextResponse.json({ error: "Acces interdit" }, { status: 403 })
    }

    await prisma.publication.delete({ where: { id } })

    return NextResponse.json({ success: true })
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
