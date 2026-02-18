// Callback OAuth TikTok
// Echange le code contre des tokens et cree la connexion TikTok
import { NextResponse } from "next/server"
import { verifyOAuthState } from "@/lib/oauth/state"
import { encryptToken } from "@/lib/crypto"
import { prisma } from "@/lib/prisma"
import { getPlanLimits } from "@/config/plans"
import type { PlanType } from "@/config/plans"

// Types pour les reponses API TikTok
interface TikTokTokenResponse {
  access_token: string
  refresh_token: string
  open_id: string
  expires_in: number
  refresh_expires_in: number
  token_type: string
  scope: string
}

interface TikTokUserInfo {
  data: {
    user: {
      open_id: string
      display_name: string
      avatar_url?: string
    }
  }
  error: {
    code: number
    message: string
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const errorParam = searchParams.get("error")

  // Si l'utilisateur a refuse l'autorisation
  if (errorParam) {
    console.error("Erreur OAuth TikTok retournee :", errorParam)
    return NextResponse.redirect(
      new URL("/dashboard?error=oauth_denied&platform=tiktok", origin)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/dashboard?error=invalid_state", origin)
    )
  }

  // Verifier le state CSRF
  const stateData = verifyOAuthState(state)
  if (!stateData) {
    return NextResponse.redirect(
      new URL("/dashboard?error=invalid_state", origin)
    )
  }

  const { userId, clientId } = stateData

  try {
    // Etape 1 : Echanger le code contre un access token
    const tokenResponse = await fetch(
      "https://open.tiktokapis.com/v2/oauth/token/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_key: process.env.TIKTOK_CLIENT_KEY!,
          client_secret: process.env.TIKTOK_CLIENT_SECRET!,
          code,
          grant_type: "authorization_code",
          redirect_uri: process.env.TIKTOK_REDIRECT_URI!,
        }),
      }
    )

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text()
      console.error("Erreur echange code TikTok :", errorBody)
      return NextResponse.redirect(
        new URL(
          `/dashboard/clients/${clientId}?error=oauth_failed&platform=tiktok`,
          origin
        )
      )
    }

    const tokenData: TikTokTokenResponse = await tokenResponse.json()

    if (!tokenData.access_token) {
      console.error(
        "Token TikTok manquant dans la reponse :",
        JSON.stringify(tokenData)
      )
      return NextResponse.redirect(
        new URL(
          `/dashboard/clients/${clientId}?error=oauth_failed&platform=tiktok`,
          origin
        )
      )
    }

    // Etape 2 : Recuperer les informations du profil utilisateur
    const profileUrl = new URL(
      "https://open.tiktokapis.com/v2/user/info/"
    )
    profileUrl.searchParams.set("fields", "open_id,display_name")

    const profileResponse = await fetch(profileUrl.toString(), {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    let accountId = tokenData.open_id
    let accountName = "TikTok"

    if (profileResponse.ok) {
      const profileData: TikTokUserInfo = await profileResponse.json()

      if (profileData.data?.user) {
        accountId = profileData.data.user.open_id || accountId
        accountName =
          profileData.data.user.display_name || accountName
      }
    } else {
      console.error(
        "Erreur recuperation profil TikTok :",
        await profileResponse.text()
      )
    }

    // Calculer la date d'expiration du token
    const tokenExpiresAt = new Date(
      Date.now() + tokenData.expires_in * 1000
    )

    // Etape 3 : Verification de la limite de plateformes du plan
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, isAdmin: true },
    })

    if (!user) {
      return NextResponse.redirect(
        new URL(
          `/dashboard/clients/${clientId}?error=oauth_failed&platform=tiktok`,
          origin
        )
      )
    }

    const planLimits = getPlanLimits(user.plan as PlanType, user.isAdmin)

    // Verifier si c'est une nouvelle connexion ou une mise a jour
    const existingConnection = await prisma.platformConnection.findUnique({
      where: {
        clientId_platform_platformAccountId: {
          clientId,
          platform: "TIKTOK",
          platformAccountId: accountId,
        },
      },
    })

    if (!existingConnection) {
      const activeConnections = await prisma.platformConnection.count({
        where: { clientId, isActive: true },
      })

      if (activeConnections >= planLimits.maxPlatforms) {
        return NextResponse.redirect(
          new URL(
            `/dashboard/clients/${clientId}?error=platform_limit`,
            origin
          )
        )
      }
    }

    // Etape 4 : Creer/mettre a jour la connexion TikTok
    await prisma.platformConnection.upsert({
      where: {
        clientId_platform_platformAccountId: {
          clientId,
          platform: "TIKTOK",
          platformAccountId: accountId,
        },
      },
      update: {
        accessToken: encryptToken(tokenData.access_token),
        refreshToken: tokenData.refresh_token
          ? encryptToken(tokenData.refresh_token)
          : null,
        tokenExpiresAt,
        platformAccountName: accountName,
        isActive: true,
        errorMessage: null,
      },
      create: {
        userId,
        clientId,
        platform: "TIKTOK",
        platformAccountId: accountId,
        platformAccountName: accountName,
        accessToken: encryptToken(tokenData.access_token),
        refreshToken: tokenData.refresh_token
          ? encryptToken(tokenData.refresh_token)
          : null,
        tokenExpiresAt,
        isActive: true,
      },
    })

    return NextResponse.redirect(
      new URL(
        `/dashboard/clients/${clientId}?connected=tiktok`,
        origin
      )
    )
  } catch (error) {
    console.error("Erreur callback OAuth TikTok :", error)
    return NextResponse.redirect(
      new URL(
        `/dashboard/clients/${clientId}?error=oauth_failed&platform=tiktok`,
        origin
      )
    )
  }
}
