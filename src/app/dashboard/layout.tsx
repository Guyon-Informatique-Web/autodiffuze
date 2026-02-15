// Layout du dashboard (protege par le middleware)
// Force le rendu dynamique (toutes les pages dashboard utilisent Supabase/Prisma)
export const dynamic = "force-dynamic"

import { Sidebar } from "@/components/dashboard/Sidebar"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { MobileNav } from "@/components/dashboard/MobileNav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar desktop */}
      <Sidebar />

      {/* Contenu principal */}
      <div className="flex flex-1 flex-col md:ml-64">
        <DashboardHeader />
        <main className="flex-1 p-4 pb-20 md:p-6 md:pb-6">
          {children}
        </main>
      </div>

      {/* Navigation mobile (barre en bas) */}
      <MobileNav />
    </div>
  )
}
