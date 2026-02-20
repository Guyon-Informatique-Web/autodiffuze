// Route API pour changer le mot de passe utilisateur
import { NextResponse } from "next/server"
import { requireUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import { withErrorHandling } from "@/lib/api-error-handler"

const updatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caracteres"),
})

export const POST = withErrorHandling(async (request: Request) => {
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
      // Traduction des messages d'erreur Supabase en francais
      const supabaseErrors: Record<string, string> = {
        "New password should be different from the old password.":
          "Le nouveau mot de passe doit etre different de l'ancien.",
        "Password should be at least 6 characters.":
          "Le mot de passe doit contenir au moins 6 caracteres.",
        "Auth session missing!":
          "Session d'authentification manquante.",
      }

      const message = supabaseErrors[error.message] ?? "Erreur lors du changement de mot de passe"

      return NextResponse.json(
        { error: message },
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
});
