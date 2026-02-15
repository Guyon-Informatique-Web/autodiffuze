// Route API -- creation d'une session Stripe Checkout pour l'abonnement
import { NextResponse } from "next/server"
import { requireUser } from "@/lib/auth"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

export async function POST(request: Request) {
  try {
    const user = await requireUser()

    const body = (await request.json()) as { priceId: string; yearly: boolean }
    const { priceId } = body

    if (!priceId) {
      return NextResponse.json(
        { error: "Le priceId est requis" },
        { status: 400 }
      )
    }

    // Creer un client Stripe si l'utilisateur n'en a pas encore
    let stripeCustomerId = user.stripeCustomerId

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name ?? undefined,
        metadata: { userId: user.id },
      })

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customer.id },
      })

      stripeCustomerId = customer.id
    }

    // Creer la session Checkout
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_URL}/dashboard/settings/billing?success=true`,
      cancel_url: `${APP_URL}/dashboard/settings/billing?canceled=true`,
      metadata: { userId: user.id },
      subscription_data: {
        metadata: { userId: user.id },
      },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifie") {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
    }

    console.error("[STRIPE_CHECKOUT]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
