// Helper d'authentification -- recuperation de l'utilisateur courant
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import type { User } from "@/generated/prisma/client"

// Recupere l'utilisateur authentifie depuis la session Supabase + Prisma
// Cree automatiquement l'enregistrement Prisma si absent (premiere connexion)
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) return null

  const isAdminEmail = authUser.email === process.env.ADMIN_EMAIL

  const user = await prisma.user.upsert({
    where: { id: authUser.id },
    update: {},
    create: {
      id: authUser.id,
      email: authUser.email!,
      name: authUser.user_metadata?.name ?? authUser.user_metadata?.full_name ?? null,
      avatarUrl: authUser.user_metadata?.avatar_url ?? null,
      ...(isAdminEmail && { isAdmin: true, plan: "AGENCY" }),
    },
  })

  return user
}

// Recupere l'utilisateur ou leve une erreur (pour les routes API protegees)
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Non authentifie")
  }
  return user
}
