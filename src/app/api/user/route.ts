// Route API pour supprimer le compte utilisateur
import { NextResponse } from "next/server"
import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"
import { withErrorHandling } from "@/lib/api-error-handler"

export const DELETE = withErrorHandling(async () => {
  try {
    const user = await requireUser()

    // Si l'utilisateur a un abonnement Stripe, l'annuler
    if (user.stripeSubscriptionId) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2026-01-28.clover",
      })
      try {
        await stripe.subscriptions.cancel(user.stripeSubscriptionId)
      } catch (stripeError) {
        console.error("Erreur annulation Stripe:", stripeError)
        // On continue meme si Stripe echoue
      }
    }

    // Supprimer l'utilisateur en BDD (cascade supprime tout)
    await prisma.user.delete({
      where: { id: user.id },
    })

    // Supprimer le compte Supabase Auth avec le service role
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
      user.id
    )

    if (authError) {
      console.error("Erreur suppression Supabase Auth:", authError)
      // L'utilisateur est deja supprime de la BDD, on ne bloque pas
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifie") {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
    }
    console.error("Erreur suppression compte:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
});
