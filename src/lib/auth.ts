// Helper d'authentification -- recuperation de l'utilisateur courant
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import type { User } from "@prisma/client"

// Recupere l'utilisateur authentifie depuis la session Supabase + Prisma
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) return null

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
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
