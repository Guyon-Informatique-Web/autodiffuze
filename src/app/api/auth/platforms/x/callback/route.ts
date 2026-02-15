// Callback OAuth X (Twitter)
// Echange le code contre des tokens via PKCE et cree la connexion X
import { NextResponse } from "next/server"
import { verifyOAuthStateWithPKCE } from "@/lib/oauth/state"
import { encryptToken } from "@/lib/crypto"
import { prisma } from "@/lib/prisma"

// Types pour les reponses API X
interface XTokenResponse {
  access_token: string
  refresh_token?: string
  token_type: string
  expires_in: number
  scope: string
}

interface XUserResponse {
  data: {
    id: string
    name: string
    username: string
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const errorParam = searchParams.get("error")

  // Si l'utilisateur a refuse l'autorisation
  if (errorParam) {
    console.error("Erreur OAuth X retournee :", errorParam)
    return NextResponse.redirect(
      new URL("/dashboard?error=oauth_denied&platform=x", origin)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/dashboard?error=invalid_state", origin)
    )
  }

  // Verifier le state CSRF et recuperer le code_verifier
  const stateData = verifyOAuthStateWithPKCE(state)
  if (!stateData) {
    return NextResponse.redirect(
      new URL("/dashboard?error=invalid_state", origin)
    )
  }

  const { userId, clientId, codeVerifier } = stateData

  try {
    // Etape 1 : Echanger le code contre un access token
    // X utilise l'authentification Basic avec client_id:client_secret
    const basicAuth = Buffer.from(
      `${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`
    ).toString("base64")

    const tokenResponse = await fetch(
      "https://api.x.com/2/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: process.env.X_REDIRECT_URI!,
          client_id: process.env.X_CLIENT_ID!,
          code_verifier: codeVerifier,
        }),
      }
    )

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text()
      console.error("Erreur echange code X :", errorBody)
      return NextResponse.redirect(
        new URL(
          `/dashboard/clients/${clientId}?error=oauth_failed&platform=x`,
          origin
        )
      )
    }

    const tokenData: XTokenResponse = await tokenResponse.json()

    // Etape 2 : Recuperer les informations du profil utilisateur
    const profileResponse = await fetch(
      "https://api.x.com/2/users/me",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    )

    if (!profileResponse.ok) {
      const errorBody = await profileResponse.text()
      console.error("Erreur recuperation profil X :", errorBody)
      return NextResponse.redirect(
        new URL(
          `/dashboard/clients/${clientId}?error=oauth_failed&platform=x`,
          origin
        )
      )
    }

    const profileData: XUserResponse = await profileResponse.json()

    // Calculer la date d'expiration du token
    const tokenExpiresAt = new Date(
      Date.now() + tokenData.expires_in * 1000
    )

    // Etape 3 : Creer/mettre a jour la connexion X
    await prisma.platformConnection.upsert({
      where: {
        clientId_platform_platformAccountId: {
          clientId,
          platform: "X",
          platformAccountId: profileData.data.id,
        },
      },
      update: {
        accessToken: encryptToken(tokenData.access_token),
        refreshToken: tokenData.refresh_token
          ? encryptToken(tokenData.refresh_token)
          : null,
        tokenExpiresAt,
        platformAccountName: `@${profileData.data.username}`,
        isActive: true,
        errorMessage: null,
      },
      create: {
        userId,
        clientId,
        platform: "X",
        platformAccountId: profileData.data.id,
        platformAccountName: `@${profileData.data.username}`,
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
        `/dashboard/clients/${clientId}?connected=x`,
        origin
      )
    )
  } catch (error) {
    console.error("Erreur callback OAuth X :", error)
    return NextResponse.redirect(
      new URL(
        `/dashboard/clients/${clientId}?error=oauth_failed&platform=x`,
        origin
      )
    )
  }
}
