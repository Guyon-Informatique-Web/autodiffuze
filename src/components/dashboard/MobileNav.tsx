"use client"

// Navigation mobile (barre en bas de l'ecran)
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  PenSquare,
  FileText,
  Users,
  BarChart3,
} from "lucide-react"

const mobileNavItems = [
  {
    label: "Accueil",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Publications",
    href: "/dashboard/publications",
    icon: FileText,
  },
  {
    label: "Creer",
    href: "/dashboard/create",
    icon: PenSquare,
    isMain: true,
  },
  {
    label: "Clients",
    href: "/dashboard/clients",
    icon: Users,
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card md:hidden">
      <div className="flex h-16 items-center justify-around">
        {mobileNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href))

          if (item.isMain) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex -mt-4 h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-500 text-white shadow-lg transition-transform hover:scale-105"
              >
                <item.icon className="h-6 w-6" />
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-1 text-xs transition-colors",
                isActive
                  ? "text-violet-600 dark:text-violet-400"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
