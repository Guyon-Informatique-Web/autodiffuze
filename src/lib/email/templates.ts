// Templates HTML pour les emails transactionnels
// Design inline simple avec tables pour la compatibilite email
// Couleurs : fond blanc, accents violet (#7C3AED), texte gris fonce (#1F2937)

// Entete commune a tous les emails
function emailHeader(): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F3F4F6; padding: 40px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <tr>
              <td style="background: linear-gradient(135deg, #7C3AED, #3B82F6); padding: 24px 32px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <span style="font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; color: #FFFFFF; letter-spacing: -0.5px;">Autodiffuze</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px;">
  `
}

// Pied de page commun a tous les emails
function emailFooter(): string {
  return `
              </td>
            </tr>
            <tr>
              <td style="background-color: #F9FAFB; padding: 20px 32px; border-top: 1px solid #E5E7EB;">
                <p style="font-family: Arial, sans-serif; font-size: 12px; color: #9CA3AF; margin: 0; text-align: center;">
                  Cet email a ete envoye automatiquement par Autodiffuze.<br>
                  Vous pouvez modifier vos preferences de notification dans les parametres de votre compte.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `
}

// Bouton d'action (CTA)
function actionButton(text: string, url: string): string {
  return `
    <table cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td style="background-color: #7C3AED; border-radius: 6px; padding: 12px 24px;">
          <a href="${url}" style="font-family: Arial, sans-serif; font-size: 14px; font-weight: 600; color: #FFFFFF; text-decoration: none; display: inline-block;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `
}

// Donnees pour le template de publication echouee
interface PublishFailedData {
  userName: string
  publicationTitle: string
  platforms: { name: string; error: string }[]
  dashboardUrl: string
}

// Template : publication echouee
export function publishFailedEmail(data: PublishFailedData): string {
  const platformRows = data.platforms
    .map(
      (p) => `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #F3F4F6;">
          <strong style="font-family: Arial, sans-serif; font-size: 14px; color: #1F2937;">${p.name}</strong>
          <br>
          <span style="font-family: Arial, sans-serif; font-size: 13px; color: #EF4444;">${p.error}</span>
        </td>
      </tr>
    `
    )
    .join("")

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; background-color: #F3F4F6;">
      ${emailHeader()}

      <h2 style="font-family: Arial, sans-serif; font-size: 20px; color: #1F2937; margin: 0 0 8px 0;">
        Publication echouee
      </h2>
      <p style="font-family: Arial, sans-serif; font-size: 14px; color: #6B7280; margin: 0 0 24px 0;">
        Bonjour ${data.userName || ""},
      </p>
      <p style="font-family: Arial, sans-serif; font-size: 14px; color: #4B5563; margin: 0 0 16px 0;">
        La publication <strong style="color: #1F2937;">"${data.publicationTitle}"</strong> a rencontre des erreurs sur une ou plusieurs plateformes.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FEF2F2; border: 1px solid #FECACA; border-radius: 6px; margin-bottom: 16px;">
        <tr>
          <td style="padding: 12px 16px; background-color: #FEE2E2; border-bottom: 1px solid #FECACA; border-radius: 6px 6px 0 0;">
            <strong style="font-family: Arial, sans-serif; font-size: 13px; color: #991B1B;">Plateformes en erreur</strong>
          </td>
        </tr>
        ${platformRows}
      </table>

      <p style="font-family: Arial, sans-serif; font-size: 14px; color: #4B5563; margin: 0 0 8px 0;">
        Vous pouvez consulter les details et relancer la publication depuis votre tableau de bord.
      </p>

      ${actionButton("Voir le tableau de bord", data.dashboardUrl)}

      ${emailFooter()}
    </body>
    </html>
  `
}

// Donnees pour le template de token expire
interface TokenExpiredData {
  userName: string
  platformName: string
  clientName: string
  reconnectUrl: string
}

// Template : token de connexion expire
export function tokenExpiredEmail(data: TokenExpiredData): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; background-color: #F3F4F6;">
      ${emailHeader()}

      <h2 style="font-family: Arial, sans-serif; font-size: 20px; color: #1F2937; margin: 0 0 8px 0;">
        Connexion expiree
      </h2>
      <p style="font-family: Arial, sans-serif; font-size: 14px; color: #6B7280; margin: 0 0 24px 0;">
        Bonjour ${data.userName || ""},
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FFFBEB; border: 1px solid #FDE68A; border-radius: 6px; margin-bottom: 16px;">
        <tr>
          <td style="padding: 16px;">
            <p style="font-family: Arial, sans-serif; font-size: 14px; color: #92400E; margin: 0;">
              La connexion a <strong>${data.platformName}</strong> pour le client <strong>${data.clientName}</strong> a expire.
              Les publications planifiees sur cette plateforme ne pourront pas etre diffusees tant que la connexion ne sera pas retablie.
            </p>
          </td>
        </tr>
      </table>

      <p style="font-family: Arial, sans-serif; font-size: 14px; color: #4B5563; margin: 0 0 8px 0;">
        Reconnectez votre compte pour continuer a publier automatiquement.
      </p>

      ${actionButton("Reconnecter le compte", data.reconnectUrl)}

      ${emailFooter()}
    </body>
    </html>
  `
}

// Donnees pour le template de rappel de publications planifiees
interface ScheduledReminderData {
  userName: string
  publications: { title: string; scheduledAt: Date; platforms: string[] }[]
  dashboardUrl: string
}

// Template : rappel de publications planifiees demain
export function scheduledReminderEmail(data: ScheduledReminderData): string {
  const count = data.publications.length

  const publicationRows = data.publications
    .map((pub) => {
      const time = pub.scheduledAt.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Paris",
      })
      const platformBadges = pub.platforms
        .map(
          (p) =>
            `<span style="display: inline-block; background-color: #EDE9FE; color: #6D28D9; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; margin-right: 4px;">${p}</span>`
        )
        .join(" ")

      return `
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #F3F4F6;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <strong style="font-family: Arial, sans-serif; font-size: 14px; color: #1F2937;">${pub.title || "Sans titre"}</strong>
                  <br>
                  <span style="font-family: Arial, sans-serif; font-size: 13px; color: #7C3AED; font-weight: 600;">${time}</span>
                  <span style="font-family: Arial, sans-serif; font-size: 13px; color: #9CA3AF;"> - </span>
                  ${platformBadges}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `
    })
    .join("")

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; background-color: #F3F4F6;">
      ${emailHeader()}

      <h2 style="font-family: Arial, sans-serif; font-size: 20px; color: #1F2937; margin: 0 0 8px 0;">
        Rappel : ${count} publication${count > 1 ? "s" : ""} planifiee${count > 1 ? "s" : ""} demain
      </h2>
      <p style="font-family: Arial, sans-serif; font-size: 14px; color: #6B7280; margin: 0 0 24px 0;">
        Bonjour ${data.userName || ""},
      </p>
      <p style="font-family: Arial, sans-serif; font-size: 14px; color: #4B5563; margin: 0 0 16px 0;">
        Voici les publications prevues pour demain :
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F5F3FF; border: 1px solid #DDD6FE; border-radius: 6px; margin-bottom: 16px;">
        <tr>
          <td style="padding: 12px 16px; background-color: #EDE9FE; border-bottom: 1px solid #DDD6FE; border-radius: 6px 6px 0 0;">
            <strong style="font-family: Arial, sans-serif; font-size: 13px; color: #5B21B6;">Publications planifiees</strong>
          </td>
        </tr>
        ${publicationRows}
      </table>

      <p style="font-family: Arial, sans-serif; font-size: 14px; color: #4B5563; margin: 0 0 8px 0;">
        Verifiez et ajustez vos publications depuis votre tableau de bord si necessaire.
      </p>

      ${actionButton("Voir le tableau de bord", data.dashboardUrl)}

      ${emailFooter()}
    </body>
    </html>
  `
}
