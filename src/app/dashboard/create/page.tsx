// Page de creation de publication (Server Component)
import { redirect } from "next/navigation"
import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPlanLimits } from "@/config/plans"
import type { PlanType } from "@/config/plans"
import { PublicationEditor } from "@/components/dashboard/publications/PublicationEditor"

export const metadata = {
  title: "Creer une publication",
}

export default async function CreatePublicationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  let user
  try {
    user = await requireUser()
  } catch {
    redirect("/login")
  }

  const resolvedParams = await searchParams

  // Recuperer les clients de l'utilisateur avec leurs informations de base
  const clients = await prisma.client.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      industry: true,
      tone: true,
    },
    orderBy: { name: "asc" },
  })

  // Recuperer les limites du plan
  const planLimits = getPlanLimits(user.plan as PlanType)

  // Charger les templates si le plan le permet
  let templates: Array<{
    id: string
    name: string
    description: string | null
    baseContent: string
    contentType: string
    platforms: string[]
    hashtags: string[]
    category: string | null
  }> = []

  let initialTemplate: typeof templates[number] | null = null

  if (planLimits.templates) {
    const rawTemplates = await prisma.template.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        description: true,
        baseContent: true,
        contentType: true,
        platforms: true,
        hashtags: true,
        category: true,
      },
      orderBy: { updatedAt: "desc" },
    })

    // Convertir les enums en strings pour le composant client
    templates = rawTemplates.map((t) => ({
      ...t,
      contentType: t.contentType as string,
      platforms: t.platforms as string[],
    }))

    // Si un templateId est passe en query param, charger le template initial
    const templateId = typeof resolvedParams.templateId === "string"
      ? resolvedParams.templateId
      : undefined

    if (templateId) {
      initialTemplate = templates.find((t) => t.id === templateId) ?? null
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* En-tete de la page */}
      <div>
        <h1 className="text-2xl font-bold">Creer une publication</h1>
        <p className="text-muted-foreground">
          Redigez votre contenu, adaptez-le a chaque plateforme et publiez en un clic.
        </p>
      </div>

      {/* Editeur principal */}
      <PublicationEditor
        clients={clients}
        planLimits={planLimits}
        userPlan={user.plan as PlanType}
        templates={templates}
        initialTemplate={initialTemplate}
      />
    </div>
  )
}
