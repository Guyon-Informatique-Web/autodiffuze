// Route API pour deconnecter une plateforme
import { NextResponse } from "next/server"
import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser()
    const { id } = await params

    // Verifier que la connexion appartient a l'utilisateur
    const connection = await prisma.platformConnection.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!connection) {
      return NextResponse.json(
        { error: "Connexion introuvable" },
        { status: 404 }
      )
    }

    // Supprimer la connexion
    await prisma.platformConnection.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifie") {
      return NextResponse.json(
        { error: "Non authentifie" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la connexion" },
      { status: 500 }
    )
  }
}
