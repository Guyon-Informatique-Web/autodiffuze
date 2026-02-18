// API route pour la liste et la creation de templates
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { createTemplateSchema } from "@/lib/validations/template"
import { getPlanLimits } from "@/config/plans"
import type { PlanType } from "@/config/plans"

// GET : Liste les templates de l'utilisateur connecte
export async function GET() {
  try {
    const user = await requireUser()

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

    const templates = await prisma.template.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json({ templates })
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

// POST : Creer un nouveau template
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser()

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

    const body: unknown = await request.json()
    const validation = createTemplateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const data = validation.data

    const template = await prisma.template.create({
      data: {
        userId: user.id,
        name: data.name,
        description: data.description || null,
        baseContent: data.baseContent,
        contentType: data.contentType ?? "POST",
        platforms: data.platforms ?? [],
        hashtags: data.hashtags ?? [],
        category: data.category || null,
      },
    })

    return NextResponse.json({ template }, { status: 201 })
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
