// Route API pour rafraichir le token d'une connexion plateforme
import { NextResponse } from "next/server"
import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { decryptToken, encryptToken } from "@/lib/crypto"
import type { PlatformType } from "@/generated/prisma/client"
import { withErrorHandling } from "@/lib/api-error-handler"

// Types pour les reponses de rafraichissement des differentes plateformes
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

// Rafraichir un token Meta (Facebook / Instagram)
async function refreshMetaToken(currentAccessToken: string): Promise<{
  accessToken: string
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
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  }
}

// Rafraichir un token X (Twitter)
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

// Rafraichir un token TikTok
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

// Dispatcher le rafraichissement selon la plateforme
async function refreshTokenForPlatform(
  platform: PlatformType,
  accessToken: string,
  refreshToken: string | null
): Promise<{
  accessToken: string
  refreshToken: string | null
  expiresAt: Date
}> {
  switch (platform) {
    case "FACEBOOK":
    case "INSTAGRAM": {
      // Meta utilise l'access token actuel pour obtenir un nouveau long-lived token
      const metaResult = await refreshMetaToken(accessToken)
      return {
        accessToken: metaResult.accessToken,
        refreshToken: null,
        expiresAt: metaResult.expiresAt,
      }
    }

    case "LINKEDIN":
      throw new Error(
        "LinkedIn ne supporte pas le rafraichissement automatique des tokens. Veuillez reconnecter votre compte."
      )

    case "X": {
      if (!refreshToken) {
        throw new Error("Aucun refresh token disponible pour X. Veuillez reconnecter votre compte.")
      }
      const xResult = await refreshXToken(refreshToken)
      return {
        accessToken: xResult.accessToken,
        refreshToken: xResult.refreshToken,
        expiresAt: xResult.expiresAt,
      }
    }

    case "TIKTOK": {
      if (!refreshToken) {
        throw new Error("Aucun refresh token disponible pour TikTok. Veuillez reconnecter votre compte.")
      }
      const tiktokResult = await refreshTikTokToken(refreshToken)
      return {
        accessToken: tiktokResult.accessToken,
        refreshToken: tiktokResult.refreshToken,
        expiresAt: tiktokResult.expiresAt,
      }
    }
  }
}

export const POST = withErrorHandling(async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const user = await requireUser()
    const { id } = await params

    // Verifier que la connexion appartient a l'utilisateur
    const connection = await prisma.platformConnection.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!connection) {
      return NextResponse.json(
        { error: "Connexion introuvable" },
        { status: 404 }
      )
    }

    // Dechiffrer les tokens actuels
    const decryptedAccessToken = decryptToken(connection.accessToken)
    const decryptedRefreshToken = connection.refreshToken
      ? decryptToken(connection.refreshToken)
      : null

    try {
      // Rafraichir le token selon la plateforme
      const result = await refreshTokenForPlatform(
        connection.platform,
        decryptedAccessToken,
        decryptedRefreshToken
      )

      // Chiffrer les nouveaux tokens avant stockage
      const encryptedAccessToken = encryptToken(result.accessToken)
      const encryptedRefreshToken = result.refreshToken
        ? encryptToken(result.refreshToken)
        : null

      // Mettre a jour la connexion en base de donnees
      const updatedConnection = await prisma.platformConnection.update({
        where: { id },
        data: {
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          tokenExpiresAt: result.expiresAt,
          isActive: true,
          errorMessage: null,
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
            },
          },
        },
      })

      return NextResponse.json(updatedConnection)
    } catch (refreshError) {
      // En cas d'echec du rafraichissement, marquer la connexion comme inactive
      const errorMessage =
        refreshError instanceof Error
          ? refreshError.message
          : "Erreur inconnue lors du rafraichissement"

      const updatedConnection = await prisma.platformConnection.update({
        where: { id },
        data: {
          isActive: false,
          errorMessage,
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
            },
          },
        },
      })

      return NextResponse.json(
        {
          error: errorMessage,
          connection: updatedConnection,
        },
        { status: 422 }
      )
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifie") {
      return NextResponse.json(
        { error: "Non authentifie" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: "Erreur lors du rafraichissement du token" },
      { status: 500 }
    )
  }
});
