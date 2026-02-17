// Route API pour marquer toutes les notifications comme lues
import { NextResponse } from "next/server"
import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH() {
  try {
    const user = await requireUser()

    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifie") {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
    }
    console.error("Erreur marquer tout comme lu :", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
