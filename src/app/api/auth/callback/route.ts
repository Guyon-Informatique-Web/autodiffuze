// Callback OAuth Supabase (pour Google, GitHub, etc.)
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { withErrorHandling } from "@/lib/api-error-handler"

export const GET = withErrorHandling(async (request: Request) => {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host")
      const isLocalEnv = process.env.NODE_ENV === "development"
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Erreur d'authentification, rediriger vers login avec erreur
  return NextResponse.redirect(`${origin}/login?error=auth_error`)
}, "AUTH");
