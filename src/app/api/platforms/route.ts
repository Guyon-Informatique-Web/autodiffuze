// Route API pour lister les connexions plateformes de l'utilisateur
import { NextResponse } from "next/server"
import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const user = await requireUser()

    // Recuperer toutes les connexions avec les infos client, triees par client puis plateforme
    const connections = await prisma.platformConnection.findMany({
      where: { userId: user.id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
      },
      orderBy: [
        { client: { name: "asc" } },
        { platform: "asc" },
      ],
    })

    return NextResponse.json(connections)
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifie") {
      return NextResponse.json(
        { error: "Non authentifie" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des connexions" },
      { status: 500 }
    )
  }
}
