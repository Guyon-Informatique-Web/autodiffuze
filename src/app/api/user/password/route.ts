// Route API pour changer le mot de passe utilisateur
import { NextResponse } from "next/server"
import { requireUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const updatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caracteres"),
})

export async function POST(request: Request) {
  try {
    await requireUser()
    const body: unknown = await request.json()
    const parsed = updatePasswordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifie") {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
    }
    console.error("Erreur changement mot de passe:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
