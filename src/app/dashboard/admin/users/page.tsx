// Panel admin -- gestion des utilisateurs
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Shield, Users, ArrowLeft } from "lucide-react"
import Link from "next/link"

import { requireAdmin } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { PLANS, type PlanType } from "@/config/plans"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export const metadata = {
  title: "Utilisateurs - Administration",
}

export default async function AdminUsersPage() {
  await requireAdmin()

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          publications: true,
          clients: true,
          platformConnections: true,
          templates: true,
        },
      },
    },
  })

  return (
    <div className="space-y-6">
      {/* En-tete */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/admin">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-red-600 to-orange-500">
          <Users className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Utilisateurs</h1>
          <p className="text-muted-foreground">{users.length} utilisateur{users.length > 1 ? "s" : ""} inscrits</p>
        </div>
      </div>

      {/* Tableau des utilisateurs */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-4 font-medium">Utilisateur</th>
                  <th className="p-4 font-medium">Plan</th>
                  <th className="p-4 font-medium">Role</th>
                  <th className="p-4 font-medium">Inscription</th>
                  <th className="p-4 font-medium">Clients</th>
                  <th className="p-4 font-medium">Publications</th>
                  <th className="p-4 font-medium">Connexions</th>
                  <th className="p-4 font-medium">Templates</th>
                  <th className="p-4 font-medium">Credits IA</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const planConfig = PLANS[u.plan as PlanType]
                  const planLimits = planConfig?.limits

                  return (
                    <tr key={u.id} className="border-b transition-colors hover:bg-muted/50 last:border-0">
                      <td className="p-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{u.name ?? "Sans nom"}</p>
                            {u.isAdmin && (
                              <Shield className="h-3.5 w-3.5 text-red-500" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge
                          className={
                            u.plan === "AGENCY"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                              : u.plan === "PRO"
                                ? "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          }
                        >
                          {planConfig?.name ?? u.plan}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {u.isAdmin ? (
                          <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                            Admin
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Utilisateur</span>
                        )}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {format(u.createdAt, "d MMM yyyy", { locale: fr })}
                      </td>
                      <td className="p-4">{u._count.clients}</td>
                      <td className="p-4">{u._count.publications}</td>
                      <td className="p-4">{u._count.platformConnections}</td>
                      <td className="p-4">{u._count.templates}</td>
                      <td className="p-4">
                        <span className={u.aiCreditsUsed > 0 ? "text-amber-600" : "text-muted-foreground"}>
                          {u.aiCreditsUsed}
                          {planLimits && (
                            <span className="text-muted-foreground">
                              /{planLimits.aiGenerationsPerMonth}
                            </span>
                          )}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
