// Route API pour la liste des notifications (paginee)
import { NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { withErrorHandling } from "@/lib/api-error-handler"

export const GET = withErrorHandling(async (request: NextRequest) => {
  try {
    const user = await requireUser()

    const { searchParams } = request.nextUrl
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
    const perPage = Math.min(50, Math.max(1, Number(searchParams.get("perPage") ?? "20")))
    const skip = (page - 1) * perPage

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: perPage,
      }),
      prisma.notification.count({
        where: { userId: user.id },
      }),
      prisma.notification.count({
        where: { userId: user.id, read: false },
      }),
    ])

    return NextResponse.json({
      notifications,
      unreadCount,
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
    console.error("Erreur recuperation notifications :", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
});
