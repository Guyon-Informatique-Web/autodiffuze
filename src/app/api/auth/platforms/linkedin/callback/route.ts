// Callback OAuth LinkedIn
// Echange le code contre un token et cree la connexion LinkedIn
import { NextResponse } from "next/server"
import { verifyOAuthState } from "@/lib/oauth/state"
import { encryptToken } from "@/lib/crypto"
import { prisma } from "@/lib/prisma"

// Types pour les reponses API LinkedIn
interface LinkedInTokenResponse {
  access_token: string
  expires_in: number
  scope?: string
}

interface LinkedInUserInfo {
  sub: string
  name?: string
  given_name?: string
  family_name?: string
  email?: string
  picture?: string
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const errorParam = searchParams.get("error")

  // Si l'utilisateur a refuse l'autorisation
  if (errorParam) {
    const errorDescription = searchParams.get("error_description")
    console.error(
      "Erreur OAuth LinkedIn retournee :",
      errorParam,
      errorDescription
    )
    return NextResponse.redirect(
      new URL("/dashboard?error=oauth_denied&platform=linkedin", origin)
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
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          client_id: process.env.LINKEDIN_CLIENT_ID!,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
          redirect_uri: process.env.LINKEDIN_REDIRECT_URI!,
        }),
      }
    )

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text()
      console.error("Erreur echange code LinkedIn :", errorBody)
      return NextResponse.redirect(
        new URL(
          `/dashboard/clients/${clientId}?error=oauth_failed&platform=linkedin`,
          origin
        )
      )
    }

    const tokenData: LinkedInTokenResponse = await tokenResponse.json()

    // Etape 2 : Recuperer les informations du profil
    const profileResponse = await fetch(
      "https://api.linkedin.com/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    )

    if (!profileResponse.ok) {
      const errorBody = await profileResponse.text()
      console.error("Erreur recuperation profil LinkedIn :", errorBody)
      return NextResponse.redirect(
        new URL(
          `/dashboard/clients/${clientId}?error=oauth_failed&platform=linkedin`,
          origin
        )
      )
    }

    const profileData: LinkedInUserInfo = await profileResponse.json()

    // Construire le nom d'affichage
    const composedName = [profileData.given_name, profileData.family_name]
      .filter(Boolean)
      .join(" ")
    const accountName = profileData.name ?? (composedName || "LinkedIn")

    // Calculer la date d'expiration du token
    const tokenExpiresAt = new Date(
      Date.now() + tokenData.expires_in * 1000
    )

    // Etape 3 : Creer/mettre a jour la connexion LinkedIn
    await prisma.platformConnection.upsert({
      where: {
        clientId_platform_platformAccountId: {
          clientId,
          platform: "LINKEDIN",
          platformAccountId: profileData.sub,
        },
      },
      update: {
        accessToken: encryptToken(tokenData.access_token),
        refreshToken: null,
        tokenExpiresAt,
        platformAccountName: accountName,
        isActive: true,
        errorMessage: null,
      },
      create: {
        userId,
        clientId,
        platform: "LINKEDIN",
        platformAccountId: profileData.sub,
        platformAccountName: accountName,
        accessToken: encryptToken(tokenData.access_token),
        tokenExpiresAt,
        isActive: true,
      },
    })

    return NextResponse.redirect(
      new URL(
        `/dashboard/clients/${clientId}?connected=linkedin`,
        origin
      )
    )
  } catch (error) {
    console.error("Erreur callback OAuth LinkedIn :", error)
    return NextResponse.redirect(
      new URL(
        `/dashboard/clients/${clientId}?error=oauth_failed&platform=linkedin`,
        origin
      )
    )
  }
}
