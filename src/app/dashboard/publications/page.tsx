// Page historique des publications -- Server Component
// Recupere les donnees initiales (liste des clients) et rend le composant interactif
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PublicationsContent } from "@/components/dashboard/publications/PublicationsContent"

export const metadata = {
  title: "Publications",
}

export default async function PublicationsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  // Recuperer la liste des clients pour le filtre
  const clients = await prisma.client.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
    },
  })

  return <PublicationsContent clients={clients} />
}
