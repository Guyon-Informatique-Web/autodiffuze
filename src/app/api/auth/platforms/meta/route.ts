// Route d'initiation OAuth Meta (Facebook + Instagram)
// Redirige l'utilisateur vers la page d'autorisation Facebook
import { NextResponse } from "next/server"
import { requireUser } from "@/lib/auth"
import { generateOAuthState } from "@/lib/oauth/state"
import { PLATFORM_CONFIG } from "@/config/platforms"

export async function GET(request: Request) {
  try {
    const user = await requireUser()

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get("clientId")

    if (!clientId) {
      return NextResponse.redirect(
        new URL("/dashboard?error=missing_client_id", request.url)
      )
    }

    // Scopes combines Facebook + Instagram
    const scopes = [
      ...PLATFORM_CONFIG.FACEBOOK.oauthScopes,
      ...PLATFORM_CONFIG.INSTAGRAM.oauthScopes,
    ]

    const state = generateOAuthState({
      userId: user.id,
      clientId,
      platform: "meta",
    })

    const params = new URLSearchParams({
      client_id: process.env.META_APP_ID!,
      redirect_uri: process.env.META_REDIRECT_URI!,
      state,
      scope: scopes.join(","),
      response_type: "code",
    })

    const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error("Erreur lors de l'initiation OAuth Meta :", error)
    return NextResponse.redirect(
      new URL("/dashboard?error=auth_required", request.url)
    )
  }
}
