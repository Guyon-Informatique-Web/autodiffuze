// Route d'initiation OAuth TikTok Login Kit
// Redirige l'utilisateur vers la page d'autorisation TikTok
import { NextResponse } from "next/server"
import { requireUser } from "@/lib/auth"
import { generateOAuthState } from "@/lib/oauth/state"
import { PLATFORM_CONFIG } from "@/config/platforms"
import { withErrorHandling } from "@/lib/api-error-handler"

export const GET = withErrorHandling(async (request: Request) => {
  try {
    const user = await requireUser()

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get("clientId")

    if (!clientId) {
      return NextResponse.redirect(
        new URL("/dashboard?error=missing_client_id", request.url)
      )
    }

    const state = generateOAuthState({
      userId: user.id,
      clientId,
      platform: "tiktok",
    })

    const params = new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      response_type: "code",
      scope: PLATFORM_CONFIG.TIKTOK.oauthScopes.join(","),
      redirect_uri: process.env.TIKTOK_REDIRECT_URI!,
      state,
    })

    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error("Erreur lors de l'initiation OAuth TikTok :", error)
    return NextResponse.redirect(
      new URL("/dashboard?error=auth_required", request.url)
    )
  }
}, "AUTH");
