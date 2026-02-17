// Route API pour marquer une notification comme lue ou la supprimer
import { NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Marquer comme lue
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser()
    const { id } = await params

    // Verification que la notification appartient a l'utilisateur
    const notification = await prisma.notification.findFirst({
      where: { id, userId: user.id },
    })

    if (!notification) {
      return NextResponse.json(
        { error: "Notification non trouvee" },
        { status: 404 }
      )
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifie") {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
    }
    console.error("Erreur mise a jour notification :", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// Supprimer une notification
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser()
    const { id } = await params

    const notification = await prisma.notification.findFirst({
      where: { id, userId: user.id },
    })

    if (!notification) {
      return NextResponse.json(
        { error: "Notification non trouvee" },
        { status: 404 }
      )
    }

    await prisma.notification.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifie") {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
    }
    console.error("Erreur suppression notification :", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
