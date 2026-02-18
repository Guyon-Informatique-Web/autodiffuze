// Page de liste des templates
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LayoutTemplate, Plus, Hash, ArrowRight, Lock } from "lucide-react"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getPlanLimits } from "@/config/plans"
import type { PlanType } from "@/config/plans"
import { PLATFORM_CONFIG, type PlatformKey } from "@/config/platforms"

export const metadata = {
  title: "Templates",
}

// Couleurs des badges de categorie
const CATEGORY_COLORS: Record<string, string> = {
  Promotion:
    "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  Evenement:
    "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  Actualite:
    "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  Temoignage:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  Conseil:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  Autre:
    "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-300",
}

export default async function TemplatesPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  // Verification que le plan autorise les templates
  const planLimits = getPlanLimits(user.plan as PlanType, user.isAdmin)

  if (!planLimits.templates) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Templates</h1>
          <p className="text-muted-foreground">
            Creez et gerez vos modeles de publication reutilisables
          </p>
        </div>

        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-950">
                <Lock className="h-8 w-8 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                Fonctionnalite Premium
              </h3>
              <p className="mb-6 max-w-md text-sm text-muted-foreground">
                Les templates vous permettent de creer des modeles de
                publication reutilisables pour gagner du temps. Passez au plan
                Pro ou Agence pour y acceder.
              </p>
              <Button
                asChild
                className="bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-700 hover:to-blue-600"
              >
                <Link href="/dashboard/settings/billing">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Voir les plans
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const templates = await prisma.template.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  })

  return (
    <div className="space-y-6">
      {/* En-tete */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Templates</h1>
          <p className="text-muted-foreground">
            Creez et gerez vos modeles de publication reutilisables
          </p>
        </div>
        <Button
          asChild
          className="bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-700 hover:to-blue-600"
        >
          <Link href="/dashboard/templates/add">
            <Plus className="mr-2 h-4 w-4" />
            Creer un template
          </Link>
        </Button>
      </div>

      {/* Liste des templates ou etat vide */}
      {templates.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-950">
                <LayoutTemplate className="h-8 w-8 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                Aucun template
              </h3>
              <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                Creez votre premier template pour gagner du temps lors de la
                redaction de vos publications. Utilisez des variables dynamiques
                pour personnaliser automatiquement le contenu.
              </p>
              <Button
                asChild
                className="bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-700 hover:to-blue-600"
              >
                <Link href="/dashboard/templates/add">
                  <Plus className="mr-2 h-4 w-4" />
                  Creer mon premier template
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Link
              key={template.id}
              href={`/dashboard/templates/${template.id}`}
            >
              <Card className="h-full transition-colors hover:border-violet-300 hover:shadow-md dark:hover:border-violet-700">
                <CardContent className="pt-0">
                  <div className="flex items-start gap-3">
                    {/* Icone */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-blue-100 dark:from-violet-950 dark:to-blue-950">
                      <LayoutTemplate className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold">
                        {template.name}
                      </h3>
                      {template.category && (
                        <Badge
                          variant="secondary"
                          className={`mt-1 border-0 text-xs ${
                            CATEGORY_COLORS[template.category] ?? CATEGORY_COLORS.Autre
                          }`}
                        >
                          {template.category}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Extrait du contenu */}
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                    {template.baseContent.length > 100
                      ? `${template.baseContent.slice(0, 100)}...`
                      : template.baseContent}
                  </p>

                  {/* Plateformes et hashtags */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {template.platforms.map((platform) => {
                      const config =
                        PLATFORM_CONFIG[platform as PlatformKey]
                      if (!config) return null
                      return (
                        <Badge
                          key={platform}
                          variant="outline"
                          className="border-0 px-1.5 py-0.5 text-xs text-white"
                          style={{ backgroundColor: config.color }}
                        >
                          {config.name}
                        </Badge>
                      )
                    })}
                    {template.hashtags.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="gap-1 text-xs"
                      >
                        <Hash className="h-3 w-3" />
                        {template.hashtags.length}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
