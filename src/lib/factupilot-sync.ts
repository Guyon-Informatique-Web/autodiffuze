// Utilitaire de synchronisation des paiements vers FactuPilot
// Auth : Bearer fp_app_* (hub multi-SaaS)
// Sans SyncQueue — les erreurs sont loguées et le système d'email d'erreur les captera

const FACTUPILOT_SYNC_URL = process.env.FACTUPILOT_SYNC_URL || "https://factupilot-dun.vercel.app"
const FACTUPILOT_APP_KEY = process.env.FACTUPILOT_APP_KEY

interface SyncPaymentData {
  client: {
    email: string
    name: string
  }
  payment: {
    amount: number
    description: string
    stripePaymentId: string
    type: "one_time" | "subscription"
    date: string
  }
}

/**
 * Tente la sync immédiate vers FactuPilot.
 * Non-bloquant : en cas d'échec, logue l'erreur (capturée par le système d'alertes email).
 */
export async function syncPaymentToFactuPilot(data: SyncPaymentData): Promise<void> {
  if (!FACTUPILOT_APP_KEY) {
    console.warn("FACTUPILOT_APP_KEY non configuré — sync FactuPilot désactivée.")
    return
  }

  try {
    const response = await fetch(`${FACTUPILOT_SYNC_URL}/api/v1/sync/payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${FACTUPILOT_APP_KEY}`,
      },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorBody}`)
    }

    const result = await response.json()
    console.log(`Sync FactuPilot réussie: ${result.invoiceNumber || result.message}`)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
    console.error("[FACTUPILOT_SYNC] Échec sync paiement:", errorMessage, JSON.stringify(data))
  }
}
