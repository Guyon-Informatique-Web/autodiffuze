// Route API pour l'export CSV des publications (AGENCY uniquement)
import { NextResponse } from "next/server"
import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPlanLimits } from "@/config/plans"
import type { PlanType } from "@/config/plans"

export async function GET() {
  try {
    const user = await requireUser()

    // Verification du plan AGENCY
    const limits = getPlanLimits(user.plan as PlanType, user.isAdmin)
    if (!limits.analytics) {
      return NextResponse.json(
        { error: "Fonctionnalite reservee au plan Agence" },
        { status: 403 }
      )
    }

    // Recuperation de toutes les publications avec leurs relations
    const publications = await prisma.publication.findMany({
      where: { userId: user.id },
      include: {
        client: { select: { name: true } },
        platformPublications: {
          include: {
            platformConnection: {
              select: { platform: true, platformAccountName: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Construction du CSV
    const headers = [
      "Titre",
      "Client",
      "Type",
      "Statut",
      "IA",
      "Plateformes",
      "Date creation",
      "Date planifiee",
      "Date publication",
    ]

    const rows = publications.map((pub) => {
      const platforms = pub.platformPublications
        .map(
          (pp) =>
            `${pp.platformConnection.platform} (${pp.status})`
        )
        .join("; ")

      return [
        escapeCsv(pub.title ?? "Sans titre"),
        escapeCsv(pub.client.name),
        pub.contentType,
        pub.status,
        pub.aiGenerated ? "Oui" : "Non",
        escapeCsv(platforms),
        formatDate(pub.createdAt),
        pub.scheduledAt ? formatDate(pub.scheduledAt) : "",
        pub.publishedAt ? formatDate(pub.publishedAt) : "",
      ].join(",")
    })

    const csv = [headers.join(","), ...rows].join("\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="autodiffuze-export-${formatDateFile(new Date())}.csv"`,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifie") {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
    }
    console.error("Erreur export CSV :", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// Echappe les valeurs CSV (guillemets doubles)
function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

// Formate une date en FR lisible
function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Formate une date pour le nom de fichier
function formatDateFile(date: Date): string {
  return date.toISOString().slice(0, 10)
}
