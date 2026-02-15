// Route d'initiation OAuth X (Twitter) avec PKCE
// Redirige l'utilisateur vers la page d'autorisation X
import { createHash } from "crypto"
import { NextResponse } from "next/server"
import { requireUser } from "@/lib/auth"
import { generateOAuthStateWithPKCE } from "@/lib/oauth/state"
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

    // Generer le state avec le code_verifier PKCE inclus
    const { state, codeVerifier } = generateOAuthStateWithPKCE({
      userId: user.id,
      clientId,
      platform: "x",
    })

    // Generer le code_challenge a partir du code_verifier (methode S256)
    const codeChallenge = createHash("sha256")
      .update(codeVerifier)
      .digest("base64url")

    const params = new URLSearchParams({
      response_type: "code",
      client_id: process.env.X_CLIENT_ID!,
      redirect_uri: process.env.X_REDIRECT_URI!,
      state,
      scope: PLATFORM_CONFIG.X.oauthScopes.join(" "),
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    })

    const authUrl = `https://x.com/i/oauth2/authorize?${params.toString()}`

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error("Erreur lors de l'initiation OAuth X :", error)
    return NextResponse.redirect(
      new URL("/dashboard?error=auth_required", request.url)
    )
  }
}
