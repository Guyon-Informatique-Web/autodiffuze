// Route API -- webhook Stripe pour traiter les evenements d'abonnement
// Cette route ne verifie PAS l'authentification utilisateur (c'est Stripe qui appelle)
import { NextResponse } from "next/server"
import type Stripe from "stripe"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { getPlanFromPriceId } from "@/lib/stripe-helpers"
import { withErrorHandling } from "@/lib/api-error-handler"

export const dynamic = "force-dynamic"

export const POST = withErrorHandling(async (request: Request) => {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json(
      { error: "Signature Stripe manquante" },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error(
      "[STRIPE_WEBHOOK] Erreur de verification de signature :",
      error
    )
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        )
        break
      }

      case "customer.subscription.updated": {
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        )
        break
      }

      case "customer.subscription.deleted": {
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        )
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        console.error(
          "[STRIPE_WEBHOOK] Paiement echoue pour la facture :",
          invoice.id,
          "- Client :",
          invoice.customer
        )
        break
      }

      default:
        // Evenement non gere, on l'ignore silencieusement
        break
    }
  } catch (error) {
    console.error("[STRIPE_WEBHOOK] Erreur de traitement :", error)
    return NextResponse.json(
      { error: "Erreur de traitement du webhook" },
      { status: 500 }
    )
  }

  return NextResponse.json({ received: true })
}, "WEBHOOK");

// Traitement de la completion d'un checkout
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId

  if (!userId) {
    console.error("[STRIPE_WEBHOOK] checkout.session.completed sans userId")
    return
  }

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id

  if (!subscriptionId) {
    console.error(
      "[STRIPE_WEBHOOK] checkout.session.completed sans subscription"
    )
    return
  }

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeCustomerId: customerId ?? undefined,
      stripeSubscriptionId: subscriptionId,
    },
  })

  // Sync vers FactuPilot (non-bloquant)
  const { syncPaymentToFactuPilot } = await import("@/lib/factupilot-sync")
  const sub = typeof session.subscription === "string"
    ? await stripe.subscriptions.retrieve(session.subscription)
    : null
  const priceId = sub?.items.data[0]?.price.id
  const isYearly = sub?.items.data[0]?.price.recurring?.interval === "year"
  // On récupère le montant depuis la session Stripe
  const amount = (session.amount_total || 0) / 100
  syncPaymentToFactuPilot({
    client: {
      email: session.customer_email || session.customer_details?.email || "",
      name: session.customer_details?.name || session.customer_email || "",
    },
    payment: {
      amount,
      description: `Abonnement Autodiffuze — ${isYearly ? "annuel" : "mensuel"}`,
      stripePaymentId: session.id,
      type: "subscription",
      date: new Date().toISOString(),
    },
  }).catch((err: unknown) => console.error("Erreur sync FactuPilot (non-bloquant):", err))
}

// Traitement de la mise a jour d'un abonnement
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId

  if (!userId) {
    console.error(
      "[STRIPE_WEBHOOK] customer.subscription.updated sans userId dans metadata"
    )
    return
  }

  // Verifier si l'abonnement est en difficulte
  if (
    subscription.status === "past_due" ||
    subscription.status === "canceled"
  ) {
    await prisma.user.update({
      where: { id: userId },
      data: { plan: "FREE" },
    })
    return
  }

  // Determiner le plan selon le prix actif
  const priceId = subscription.items.data[0]?.price?.id

  if (!priceId) {
    console.error(
      "[STRIPE_WEBHOOK] customer.subscription.updated sans priceId"
    )
    return
  }

  const plan = getPlanFromPriceId(priceId)

  await prisma.user.update({
    where: { id: userId },
    data: { plan },
  })
}

// Traitement de la suppression d'un abonnement
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const subscriptionId = subscription.id

  // Retrouver l'utilisateur via son stripeSubscriptionId
  const user = await prisma.user.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  })

  if (!user) {
    console.error(
      "[STRIPE_WEBHOOK] customer.subscription.deleted -- utilisateur introuvable pour la subscription :",
      subscriptionId
    )
    return
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      plan: "FREE",
      stripeSubscriptionId: null,
    },
  })
}
