// Guard d'administration -- verifie que l'utilisateur est admin
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import type { User } from "@/generated/prisma/client"

// Recupere l'utilisateur admin ou redirige vers le dashboard
export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  if (!user.isAdmin) {
    redirect("/dashboard")
  }
  return user
}
