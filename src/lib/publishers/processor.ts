// Processeur de jobs de publication
// Gere le cycle de vie complet d'un job : dechiffrement du token, refresh si necessaire,
// appel au publisher, gestion des retries avec backoff exponentiel
import { prisma } from "@/lib/prisma"
import { decryptToken, encryptToken } from "@/lib/crypto"
import { publishers } from "./index"
import { notifyPublishFailed } from "@/lib/email/notify"
import type { PlatformType } from "@prisma/client"

// Delais de backoff exponentiel pour les retries (en secondes)
// Retry 1 : 30s, Retry 2 : 2min, Retry 3 : 10min
const RETRY_DELAYS_SECONDS = [30, 120, 600]

// Types pour les reponses de rafraichissement des tokens
interface MetaRefreshResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface XRefreshResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

interface TikTokRefreshResponse {
  data: {
    access_token: string
    refresh_token: string
    expires_in: number
    refresh_expires_in: number
  }
  error: {
    code: string
    message: string
  }
}

// Rafraichit un token Meta (Facebook / Instagram)
async function refreshMetaToken(currentAccessToken: string): Promise<{
  accessToken: string
  refreshToken: string | null
  expiresAt: Date
}> {
  const clientId = process.env.META_APP_ID
  const clientSecret = process.env.META_APP_SECRET

  if (!clientId || !clientSecret) {
    throw new Error("Configuration Meta manquante (META_APP_ID ou META_APP_SECRET)")
  }

  const url = new URL("https://graph.facebook.com/v21.0/oauth/access_token")
  url.searchParams.set("grant_type", "fb_exchange_token")
  url.searchParams.set("client_id", clientId)
  url.searchParams.set("client_secret", clientSecret)
  url.searchParams.set("fb_exchange_token", currentAccessToken)

  const response = await fetch(url.toString(), { method: "POST" })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Echec du rafraichissement Meta : ${errorText}`)
  }

  const data = (await response.json()) as MetaRefreshResponse

  return {
    accessToken: data.access_token,
    refreshToken: null,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  }
}

// Rafraichit un token X (Twitter)
async function refreshXToken(refreshToken: string): Promise<{
  accessToken: string
  refreshToken: string
  expiresAt: Date
}> {
  const clientId = process.env.X_CLIENT_ID
  const clientSecret = process.env.X_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error("Configuration X manquante (X_CLIENT_ID ou X_CLIENT_SECRET)")
  }

  const response = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Echec du rafraichissement X : ${errorText}`)
  }

  const data = (await response.json()) as XRefreshResponse

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  }
}

// Rafraichit un token TikTok
async function refreshTikTokToken(refreshToken: string): Promise<{
  accessToken: string
  refreshToken: string
  expiresAt: Date
}> {
  const clientKey = process.env.TIKTOK_CLIENT_KEY
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET

  if (!clientKey || !clientSecret) {
    throw new Error("Configuration TikTok manquante (TIKTOK_CLIENT_KEY ou TIKTOK_CLIENT_SECRET)")
  }

  const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Echec du rafraichissement TikTok : ${errorText}`)
  }

  const data = (await response.json()) as TikTokRefreshResponse

  if (data.error?.code && data.error.code !== "ok") {
    throw new Error(`Erreur TikTok : ${data.error.message}`)
  }

  return {
    accessToken: data.data.access_token,
    refreshToken: data.data.refresh_token,
    expiresAt: new Date(Date.now() + data.data.expires_in * 1000),
  }
}

// Rafraichit le token d'une connexion plateforme si necessaire
// Retourne le token d'acces dechiffre (rafraichi ou existant)
async function ensureFreshToken(
  connectionId: string,
  platform: PlatformType,
  encryptedAccessToken: string,
  encryptedRefreshToken: string | null,
  tokenExpiresAt: Date | null
): Promise<string> {
  const decryptedAccessToken = decryptToken(encryptedAccessToken)

  // Verifier si le token est expire ou sur le point d'expirer (marge de 5 minutes)
  const isExpired = tokenExpiresAt && tokenExpiresAt.getTime() < Date.now() + 5 * 60 * 1000
  if (!isExpired) {
    return decryptedAccessToken
  }

  // Tenter le rafraichissement selon la plateforme
  const decryptedRefreshToken = encryptedRefreshToken ? decryptToken(encryptedRefreshToken) : null

  let result: {
    accessToken: string
    refreshToken: string | null
    expiresAt: Date
  }

  switch (platform) {
    case "FACEBOOK":
    case "INSTAGRAM":
      result = await refreshMetaToken(decryptedAccessToken)
      break

    case "LINKEDIN":
      // LinkedIn ne supporte pas le rafraichissement automatique
      // Retourner le token existant et esperer qu'il fonctionne encore
      console.error("Token LinkedIn expire, rafraichissement automatique non supporte")
      return decryptedAccessToken

    case "X":
      if (!decryptedRefreshToken) {
        throw new Error("Aucun refresh token disponible pour X")
      }
      result = await refreshXToken(decryptedRefreshToken)
      break

    case "TIKTOK":
      if (!decryptedRefreshToken) {
        throw new Error("Aucun refresh token disponible pour TikTok")
      }
      result = await refreshTikTokToken(decryptedRefreshToken)
      break
  }

  // Mettre a jour les tokens en base de donnees
  await prisma.platformConnection.update({
    where: { id: connectionId },
    data: {
      accessToken: encryptToken(result.accessToken),
      refreshToken: result.refreshToken ? encryptToken(result.refreshToken) : null,
      tokenExpiresAt: result.expiresAt,
      isActive: true,
      errorMessage: null,
    },
  })

  return result.accessToken
}

// Calcule le delai avant la prochaine tentative (backoff exponentiel)
function getRetryDelay(attemptNumber: number): number {
  const index = Math.min(attemptNumber - 1, RETRY_DELAYS_SECONDS.length - 1)
  return RETRY_DELAYS_SECONDS[index] * 1000
}

// Traite un job de publication individuel
export async function processPublishJob(jobId: string): Promise<void> {
  // Recuperer le job avec toutes ses relations
  const job = await prisma.publishJob.findUnique({
    where: { id: jobId },
  })

  if (!job) {
    console.error(`Job introuvable : ${jobId}`)
    return
  }

  if (job.status !== "PENDING") {
    console.error(`Job ${jobId} n'est pas en status PENDING (status actuel : ${job.status})`)
    return
  }

  // Recuperer la PlatformPublication et la PlatformConnection associees
  const platformPublication = await prisma.platformPublication.findUnique({
    where: { id: job.platformPublicationId },
    include: {
      platformConnection: true,
    },
  })

  if (!platformPublication) {
    console.error(`PlatformPublication introuvable pour le job ${jobId}`)
    await prisma.publishJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        lastError: "PlatformPublication introuvable",
        processedAt: new Date(),
      },
    })
    return
  }

  const connection = platformPublication.platformConnection

  // Verifier que la connexion est active
  if (!connection.isActive) {
    await prisma.publishJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        lastError: `Connexion ${connection.platform} inactive : ${connection.errorMessage ?? "raison inconnue"}`,
        processedAt: new Date(),
      },
    })
    await prisma.platformPublication.update({
      where: { id: platformPublication.id },
      data: {
        status: "FAILED",
        errorMessage: `Connexion ${connection.platform} inactive`,
      },
    })
    return
  }

  // Marquer le job comme en cours de traitement
  await prisma.publishJob.update({
    where: { id: jobId },
    data: {
      status: "PROCESSING",
      attempts: { increment: 1 },
    },
  })

  try {
    // Dechiffrer et rafraichir le token si necessaire
    const accessToken = await ensureFreshToken(
      connection.id,
      connection.platform,
      connection.accessToken,
      connection.refreshToken,
      connection.tokenExpiresAt
    )

    // Recuperer le publisher correspondant a la plateforme
    const publisher = publishers[connection.platform]

    // Appeler le publisher
    const result = await publisher({
      content: platformPublication.adaptedContent,
      hashtags: platformPublication.hashtags,
      mediaUrls: platformPublication.mediaUrls,
      accessToken,
      platformAccountId: connection.platformAccountId,
      platformPageId: connection.platformPageId,
    })

    if (result.success) {
      // Succes : marquer le job et la publication plateforme
      await prisma.publishJob.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          processedAt: new Date(),
        },
      })

      await prisma.platformPublication.update({
        where: { id: platformPublication.id },
        data: {
          status: "PUBLISHED",
          platformPostId: result.platformPostId ?? null,
          platformPostUrl: result.platformPostUrl ?? null,
          publishedAt: new Date(),
        },
      })

      // Mettre a jour la date de derniere utilisation de la connexion
      await prisma.platformConnection.update({
        where: { id: connection.id },
        data: { lastUsedAt: new Date() },
      })
    } else {
      // Echec : gerer les retries
      await handleJobFailure(jobId, job.attempts + 1, job.maxAttempts, result.error ?? "Erreur inconnue", platformPublication.id)
    }
  } catch (error) {
    // Erreur inattendue : ne jamais laisser un job en PROCESSING
    const errorMessage = error instanceof Error ? error.message : "Erreur inattendue lors du traitement"
    console.error(`Erreur inattendue pour le job ${jobId} :`, error)

    // Relire le job pour avoir le nombre de tentatives a jour
    const updatedJob = await prisma.publishJob.findUnique({
      where: { id: jobId },
      select: { attempts: true, maxAttempts: true },
    })

    await handleJobFailure(
      jobId,
      updatedJob?.attempts ?? 1,
      updatedJob?.maxAttempts ?? 3,
      errorMessage,
      platformPublication.id
    )
  }
}

// Gere l'echec d'un job : retry ou echec definitif
async function handleJobFailure(
  jobId: string,
  currentAttempts: number,
  maxAttempts: number,
  errorMessage: string,
  platformPublicationId: string
): Promise<void> {
  if (currentAttempts < maxAttempts) {
    // Encore des tentatives restantes : programmer un retry avec backoff exponentiel
    const delayMs = getRetryDelay(currentAttempts)
    const nextRetryAt = new Date(Date.now() + delayMs)

    await prisma.publishJob.update({
      where: { id: jobId },
      data: {
        status: "PENDING",
        lastError: errorMessage,
        nextRetryAt,
      },
    })
  } else {
    // Plus de tentatives : echec definitif
    await prisma.publishJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        lastError: errorMessage,
        processedAt: new Date(),
      },
    })

    await prisma.platformPublication.update({
      where: { id: platformPublicationId },
      data: {
        status: "FAILED",
        errorMessage,
      },
    })
  }
}

// Met a jour le statut global d'une publication en fonction de ses publications plateforme
// Envoie une notification si la publication a echoue ou est partiellement echouee
export async function updatePublicationStatus(publicationId: string): Promise<void> {
  const platformPublications = await prisma.platformPublication.findMany({
    where: { publicationId },
    select: {
      status: true,
      errorMessage: true,
      platformConnection: {
        select: { platform: true },
      },
    },
  })

  if (platformPublications.length === 0) return

  const statuses = platformPublications.map((pp) => pp.status)

  // Verifier si tous les jobs sont termines (pas de PENDING ou PUBLISHING)
  const hasPending = statuses.some((s) => s === "PENDING" || s === "PUBLISHING")
  if (hasPending) {
    // Des jobs sont encore en cours, ne pas mettre a jour le statut global
    return
  }

  const allPublished = statuses.every((s) => s === "PUBLISHED" || s === "SKIPPED")
  const allFailed = statuses.every((s) => s === "FAILED")

  let publicationStatus: "PUBLISHED" | "PARTIAL" | "FAILED"
  if (allPublished) {
    publicationStatus = "PUBLISHED"
  } else if (allFailed) {
    publicationStatus = "FAILED"
  } else {
    publicationStatus = "PARTIAL"
  }

  await prisma.publication.update({
    where: { id: publicationId },
    data: {
      status: publicationStatus,
      ...(publicationStatus === "PUBLISHED" ? { publishedAt: new Date() } : {}),
    },
  })

  // Notifier l'utilisateur en cas d'echec ou de succes partiel
  if (publicationStatus === "FAILED" || publicationStatus === "PARTIAL") {
    try {
      const publication = await prisma.publication.findUnique({
        where: { id: publicationId },
        select: { userId: true },
      })

      if (publication) {
        const failedPlatforms = platformPublications
          .filter((pp) => pp.status === "FAILED")
          .map((pp) => ({
            name: pp.platformConnection.platform,
            error: pp.errorMessage ?? "Erreur inconnue",
          }))

        // Notification en arriere-plan, ne pas bloquer le flow principal
        notifyPublishFailed(
          publication.userId,
          publicationId,
          failedPlatforms
        ).catch((err) => {
          console.error(
            `[Processor] Erreur notification publication echouee (pub=${publicationId}) :`,
            err
          )
        })
      }
    } catch (err) {
      console.error(
        `[Processor] Erreur recuperation donnees pour notification (pub=${publicationId}) :`,
        err
      )
    }
  }
}
