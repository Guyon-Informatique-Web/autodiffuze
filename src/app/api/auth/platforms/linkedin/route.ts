// Route d'initiation OAuth LinkedIn
// Redirige l'utilisateur vers la page d'autorisation LinkedIn
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
      platform: "linkedin",
    })

    const params = new URLSearchParams({
      response_type: "code",
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      redirect_uri: process.env.LINKEDIN_REDIRECT_URI!,
      state,
      scope: PLATFORM_CONFIG.LINKEDIN.oauthScopes.join(" "),
    })

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error("Erreur lors de l'initiation OAuth LinkedIn :", error)
    return NextResponse.redirect(
      new URL("/dashboard?error=auth_required", request.url)
    )
  }
}, "AUTH");
