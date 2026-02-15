// Helper d'envoi d'email via Resend
// Les erreurs sont loggees mais jamais propagees pour ne pas bloquer le flow principal
import { resend } from "./resend"

const EMAIL_FROM = process.env.EMAIL_FROM ?? "noreply@autodiffuze.com"

// Envoie un email via Resend
// En cas d'erreur ou de configuration manquante, log un warning sans lancer d'exception
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      "[Email] RESEND_API_KEY non configuree, email non envoye :",
      subject
    )
    return
  }

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    })

    if (error) {
      console.error("[Email] Erreur Resend :", error)
    }
  } catch (err) {
    console.error("[Email] Erreur lors de l'envoi :", err)
  }
}
