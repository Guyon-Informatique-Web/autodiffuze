// Route API -- creation d'une session du portail client Stripe
import { NextResponse } from "next/server"
import { requireUser } from "@/lib/auth"
import { stripe } from "@/lib/stripe"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

export async function POST() {
  try {
    const user = await requireUser()

    if (!user.stripeCustomerId) {
      return NextResponse.json(
        { error: "Aucun abonnement Stripe associe a ce compte" },
        { status: 400 }
      )
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${APP_URL}/dashboard/settings/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifie") {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
    }

    console.error("[STRIPE_PORTAL]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
