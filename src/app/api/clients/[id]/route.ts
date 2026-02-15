// API route pour le detail, la modification et la suppression d'un client
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { updateClientSchema } from "@/lib/validations/client"

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET : Detail d'un client avec ses connexions et 5 dernieres publications
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser()
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
      },
    })

    if (!client) {
      return NextResponse.json({ error: "Client introuvable" }, { status: 404 })
    }

    if (client.userId !== user.id) {
      return NextResponse.json({ error: "Acces interdit" }, { status: 403 })
    }

    return NextResponse.json({ client })
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

// PATCH : Modifier un client
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser()
    const { id } = await params

    // Verification de l'appartenance
    const existing = await prisma.client.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!existing) {
      return NextResponse.json({ error: "Client introuvable" }, { status: 404 })
    }

    if (existing.userId !== user.id) {
      return NextResponse.json({ error: "Acces interdit" }, { status: 403 })
    }

    const body: unknown = await request.json()
    const validation = updateClientSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const data = validation.data

    const client = await prisma.client.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description || null,
        }),
        ...(data.website !== undefined && { website: data.website || null }),
        ...(data.industry !== undefined && { industry: data.industry || null }),
        ...(data.tone !== undefined && { tone: data.tone || null }),
        ...(data.targetAudience !== undefined && {
          targetAudience: data.targetAudience || null,
        }),
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl || null }),
      },
    })

    return NextResponse.json({ client })
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

// DELETE : Supprimer un client (cascade geree par Prisma)
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser()
    const { id } = await params

    // Verification de l'appartenance
    const existing = await prisma.client.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!existing) {
      return NextResponse.json({ error: "Client introuvable" }, { status: 404 })
    }

    if (existing.userId !== user.id) {
      return NextResponse.json({ error: "Acces interdit" }, { status: 403 })
    }

    await prisma.client.delete({ where: { id } })

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
