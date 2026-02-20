// Route API pour modifier le profil utilisateur
import { NextResponse } from "next/server"
import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { withErrorHandling } from "@/lib/api-error-handler"

const updateProfileSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100, "Le nom est trop long"),
})

export const PATCH = withErrorHandling(async (request: Request) => {
  try {
    const user = await requireUser()
    const body: unknown = await request.json()
    const parsed = updateProfileSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { name: parsed.data.name },
    })

    return NextResponse.json({
      name: updatedUser.name,
      email: updatedUser.email,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifie") {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
    }
    console.error("Erreur modification profil:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
});
