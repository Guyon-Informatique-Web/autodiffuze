// Page de liste des clients
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, Link2, FileText, Building2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Clients",
}

export default async function ClientsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const clients = await prisma.client.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          platformConnections: true,
          publications: true,
        },
      },
    },
  })

  return (
    <div className="space-y-6">
      {/* En-tete */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground">
            Gerez vos clients et leurs marques
          </p>
        </div>
        <Button
          asChild
          className="bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-700 hover:to-blue-600"
        >
          <Link href="/dashboard/clients/add">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un client
          </Link>
        </Button>
      </div>

      {/* Liste des clients ou etat vide */}
      {clients.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-950">
                <Users className="h-8 w-8 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Aucun client</h3>
              <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                Commencez par ajouter votre premier client pour organiser vos
                publications et connecter des plateformes.
              </p>
              <Button
                asChild
                className="bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-700 hover:to-blue-600"
              >
                <Link href="/dashboard/clients/add">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter mon premier client
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Link key={client.id} href={`/dashboard/clients/${client.id}`}>
              <Card className="transition-colors hover:border-violet-300 hover:shadow-md dark:hover:border-violet-700">
                <CardContent className="pt-0">
                  <div className="flex items-start gap-4">
                    {/* Avatar / Logo placeholder */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-blue-100 dark:from-violet-950 dark:to-blue-950">
                      {client.logoUrl ? (
                        <Image
                          src={client.logoUrl}
                          alt={client.name}
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <Building2 className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold">{client.name}</h3>
                      {client.industry && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {client.industry}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Link2 className="h-3.5 w-3.5" />
                      <span>
                        {client._count.platformConnections} plateforme
                        {client._count.platformConnections !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      <span>
                        {client._count.publications} publication
                        {client._count.publications !== 1 ? "s" : ""}
                      </span>
                    </div>
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
