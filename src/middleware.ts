import { updateSession } from "@/lib/supabase/middleware"
import { type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Matcher toutes les routes sauf les fichiers statiques et les API
    "/((?!_next/static|_next/image|favicon.ico|platforms/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
