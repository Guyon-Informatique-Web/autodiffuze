// Page de detail d'un template (Server Component)
import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { TemplateDetailContent } from "./TemplateDetailContent"

export const metadata = {
  title: "Detail du template",
}

interface TemplateDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function TemplateDetailPage({
  params,
}: TemplateDetailPageProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const { id } = await params

  const template = await prisma.template.findUnique({
    where: { id },
  })

  if (!template || template.userId !== user.id) {
    notFound()
  }

  // Serialiser les dates pour le composant client
  const serializedTemplate = {
    ...template,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  }

  return <TemplateDetailContent template={serializedTemplate} />
}
