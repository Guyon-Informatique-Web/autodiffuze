// API route pour le detail, la modification et la suppression d'un template
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { updateTemplateSchema } from "@/lib/validations/template"
import { getPlanLimits } from "@/config/plans"
import type { PlanType } from "@/config/plans"
import { withErrorHandling } from "@/lib/api-error-handler"

// GET : Detail d'un template
export const GET = withErrorHandling(async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const user = await requireUser()
    const { id } = await params

    const template = await prisma.template.findUnique({
      where: { id },
    })

    if (!template) {
      return NextResponse.json(
        { error: "Template introuvable" },
        { status: 404 }
      )
    }

    if (template.userId !== user.id) {
      return NextResponse.json({ error: "Acces interdit" }, { status: 403 })
    }

    return NextResponse.json({ template })
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

// PATCH : Modifier un template
export const PATCH = withErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const user = await requireUser()
    const { id } = await params

    // Verification que le plan autorise les templates
    const planLimits = getPlanLimits(user.plan as PlanType, user.isAdmin)
    if (!planLimits.templates) {
      return NextResponse.json(
        {
          error:
            "Les templates ne sont pas disponibles avec votre plan actuel. Passez au plan Pro ou Agence pour y acceder.",
        },
        { status: 403 }
      )
    }

    // Verification de l'appartenance
    const existing = await prisma.template.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Template introuvable" },
        { status: 404 }
      )
    }

    if (existing.userId !== user.id) {
      return NextResponse.json({ error: "Acces interdit" }, { status: 403 })
    }

    const body: unknown = await request.json()
    const validation = updateTemplateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const data = validation.data

    const template = await prisma.template.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description || null,
        }),
        ...(data.baseContent !== undefined && { baseContent: data.baseContent }),
        ...(data.contentType !== undefined && { contentType: data.contentType }),
        ...(data.platforms !== undefined && { platforms: data.platforms }),
        ...(data.hashtags !== undefined && { hashtags: data.hashtags }),
        ...(data.category !== undefined && {
          category: data.category || null,
        }),
      },
    })

    return NextResponse.json({ template })
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

// DELETE : Supprimer un template (cascade geree par Prisma)
export const DELETE = withErrorHandling(async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const user = await requireUser()
    const { id } = await params

    // Verification de l'appartenance
    const existing = await prisma.template.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Template introuvable" },
        { status: 404 }
      )
    }

    if (existing.userId !== user.id) {
      return NextResponse.json({ error: "Acces interdit" }, { status: 403 })
    }

    await prisma.template.delete({ where: { id } })

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
});
